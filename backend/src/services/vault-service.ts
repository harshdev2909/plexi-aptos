/**
 * @fileoverview Vault service for interacting with Aptos smart contracts.
 * Handles vault state queries, user positions, and transaction management.
 */

import { Aptos, AptosConfig, Network, Ed25519PrivateKey, Ed25519PublicKey, Account } from '@aptos-labs/ts-sdk';
import { logger } from '../utils/logger';
import { hyperliquidPositionOpener } from './hyperliquid-position-opener';

/**
 * Represents the current state of the vault
 */
export interface VaultState {
  totalAssets: number;
  totalShares: number;
  sharePrice: number;
}

/**
 * Result of a deposit operation
 */
export interface DepositResult {
  txHash: string;
  sharesMinted: number;
  success: boolean;
  hyperliquidOrderId?: number;
  hyperliquidSuccess?: boolean;
}

/**
 * Result of a withdrawal operation
 */
export interface WithdrawResult {
  txHash: string;
  amountWithdrawn: number;
  success: boolean;
}

/**
 * Service class for vault operations on Aptos blockchain
 */
export class VaultService {
  private aptos: Aptos;
  private vaultModuleAddress: string;
  private vaultModuleName: string;
  private vaultAccount: Account | null = null;

  /**
   * Initialize the vault service with Aptos configuration
   */
  constructor() {
    const config = new AptosConfig({
      network: Network.TESTNET,
      fullnode: process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
    });
    
    this.aptos = new Aptos(config);
    this.vaultModuleAddress = process.env.VAULT_MODULE_ADDRESS || '0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2';
    this.vaultModuleName = 'vault_v4';
    
    logger.info('Vault service initialized - using user wallets from frontend');
  }

  /**
   * Get the current vault state from the smart contract
   * Falls back to database calculation if contract data is unavailable
   * @returns {Promise<VaultState>} The current vault state
   */
  async getVaultState(): Promise<VaultState> {
    try {
      // Try to get data from Aptos contract using view functions
      const [totalAssets] = await this.aptos.view({
        payload: {
          function: `${this.vaultModuleAddress}::${this.vaultModuleName}::total_assets` as `${string}::${string}::${string}`,
          functionArguments: [this.vaultModuleAddress],
          typeArguments: []
        }
      });

      const [totalShares] = await this.aptos.view({
        payload: {
          function: `${this.vaultModuleAddress}::${this.vaultModuleName}::total_shares` as `${string}::${string}::${string}`,
          functionArguments: [this.vaultModuleAddress],
          typeArguments: []
        }
      });

      // Convert from APT decimals (10^8) to human readable format
      const assets = Number(totalAssets || 0) / 100000000; // Convert from 10^8 to APT
      const shares = Number(totalShares || 0) / 100000000; // Convert from 10^8 to share units
      const sharePrice = shares > 0 ? assets / shares : 1.0;

      logger.info(`Real vault state from contract: ${assets} APT assets, ${shares} shares, ${sharePrice} share price`);

      // If blockchain has no meaningful data, fall back to database calculation
      if (assets === 0 && shares === 0) {
        logger.info('Blockchain has no data, calculating from database');
        throw new Error('Blockchain data empty, using database calculation');
      }

      return {
        totalAssets: assets,
        totalShares: shares,
        sharePrice
      };
    } catch (error) {
      logger.info('Vault contract view functions not available, calculating from database data');
      
      // Calculate real data from database instead of mock data
      const { User } = await import('../models/User');
      const { Transaction: TransactionModel } = await import('../models/Transaction');
      
      // Calculate total shares from all transactions instead of User models
      const allDeposits = await TransactionModel.find({ type: 'deposit', status: 'completed' });
      const allWithdrawals = await TransactionModel.find({ type: 'withdraw', status: 'completed' });

      const totalDepositShares = allDeposits.reduce((sum, tx) => sum + tx.shares, 0);
      const totalWithdrawalShares = allWithdrawals.reduce((sum, tx) => sum + tx.shares, 0);
      const totalShares = Math.max(totalDepositShares - totalWithdrawalShares, 0);

      // Calculate total assets from the same transaction data
      const totalDeposits = allDeposits.reduce((sum, tx) => sum + tx.amount, 0);
      const totalWithdrawals = allWithdrawals.reduce((sum, tx) => sum + tx.amount, 0);
      const totalAssets = Math.max(totalDeposits - totalWithdrawals, 0);

      // If we have no assets but have shares, assume 1:1 ratio for safety
      // If we have assets, calculate share price normally
      const sharePrice = totalShares > 0 ?
        (totalAssets > 0 ? totalAssets / totalShares : 1.0) :
        1.0;

      return {
        totalAssets: Math.max(0, totalAssets),
        totalShares: Math.max(0, totalShares),
        sharePrice
      };
    }
  }

  /**
   * Get user's shares from the smart contract
   * @param {string} walletAddress - The user's wallet address
   * @returns {Promise<number>} The user's share balance
   */
  async getUserShares(walletAddress: string): Promise<number> {
    try {
      // Try to get from Aptos contract using view function (like the tests)
      const [shares] = await this.aptos.view({
        payload: {
          function: `${this.vaultModuleAddress}::${this.vaultModuleName}::get_user_shares` as `${string}::${string}::${string}`,
          functionArguments: [this.vaultModuleAddress, walletAddress],
          typeArguments: []
        }
      });

      // Convert from APT decimals (10^8) to human readable format
      const userShares = Number(shares || 0) / 100000000; // Convert from 10^8 to share units
      logger.info(`Real user shares from contract: ${userShares} shares for ${walletAddress}`);
      return userShares;
    } catch (error) {
      logger.info('User shares not found on blockchain, checking database');
      
      // Get real data from database
      const { User } = await import('../models/User');
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      return user ? user.shares : 0;
    }
  }

  /**
   * Record a deposit transaction (called after blockchain transaction is confirmed)
   * Automatically opens a position on Hyperliquid when deposit is successful
   * @param {string} walletAddress - The user's wallet address
   * @param {number} amount - The deposit amount
   * @param {string} txHash - The transaction hash
   * @returns {Promise<DepositResult>} The deposit result
   */
  async recordDeposit(walletAddress: string, amount: number, txHash: string): Promise<DepositResult> {
    try {
      logger.info(`Recording deposit: ${txHash} for ${amount} APT from user wallet ${walletAddress}`);

      let hyperliquidOrderId: number | undefined;
      let hyperliquidSuccess = false;

      // Open position on Hyperliquid after successful deposit (only if amount >= 3 APT)
      const MINIMUM_DEPOSIT_APT = 3.0; // Minimum 3 APT for position opening
      if (amount >= MINIMUM_DEPOSIT_APT) {
        try {
          logger.info(`Opening Hyperliquid position for deposit amount: ${amount} APT`);
          const hyperliquidResult = await hyperliquidPositionOpener.openPositionOnDeposit(
            amount, // deposit amount in APT tokens
            'APT', // coin to trade
            4.22 // Current APT price ~$4.22
          );
          
          hyperliquidOrderId = hyperliquidResult?.oid || hyperliquidResult?.orderId;
          hyperliquidSuccess = true;
          logger.info(`Hyperliquid position opened successfully: Order ID ${hyperliquidOrderId}`);
        } catch (hyperliquidError) {
          logger.error('Failed to open Hyperliquid position:', hyperliquidError);
          // Don't fail the entire deposit if Hyperliquid fails
          hyperliquidSuccess = false;
        }
      } else {
        logger.info(`Deposit amount ${amount} APT is below minimum ${MINIMUM_DEPOSIT_APT} APT required for Hyperliquid position opening`);
        hyperliquidSuccess = false;
      }

      return {
        txHash,
        sharesMinted: amount * 100, // 1 APT = 100 MST shares
        success: true,
        hyperliquidOrderId,
        hyperliquidSuccess
      };
    } catch (error) {
      logger.error('Error recording deposit:', error);
      throw error;
    }
  }

  /**
   * Record a withdrawal transaction (called after blockchain transaction is confirmed)
   * @param {string} walletAddress - The user's wallet address
   * @param {number} shares - The number of shares to withdraw
   * @param {string} txHash - The transaction hash
   * @returns {Promise<WithdrawResult>} The withdrawal result
   */
  async recordWithdraw(walletAddress: string, shares: number, txHash: string): Promise<WithdrawResult> {
    try {
      logger.info(`Recording withdrawal: ${txHash} for ${shares} shares from user wallet ${walletAddress}`);
      
      return {
        txHash,
        amountWithdrawn: shares,
        success: true
      };
    } catch (error) {
      logger.error('Error recording withdrawal:', error);
      throw error;
    }
  }

  /**
   * Get transaction details from Aptos blockchain
   * @param {string} txHash - The transaction hash
   * @returns {Promise<any>} The transaction details
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const transaction = await this.aptos.getTransactionByHash({
        transactionHash: txHash
      });
      return transaction;
    } catch (error) {
      logger.error('Error fetching transaction details:', error);
      throw new Error('Failed to fetch transaction details');
    }
  }

  /**
   * Wait for transaction confirmation on Aptos blockchain
   * @param {string} txHash - The transaction hash to wait for
   * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
   * @returns {Promise<boolean>} True if transaction is confirmed, false if timeout
   */
  async waitForTransaction(txHash: string, timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const transaction = await this.aptos.getTransactionByHash({
          transactionHash: txHash
        });
        
        if (transaction && 'success' in transaction && transaction.success) {
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    } catch (error) {
        // Transaction might not be confirmed yet
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

    return false;
  }

  /**
   * Get Hyperliquid position status for a user
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<any>} The position status
   */
  async getHyperliquidPositionStatus(userAddress: string): Promise<any> {
    try {
      const positions = await hyperliquidPositionOpener.getUserPositions(userAddress);
      const openOrders = await hyperliquidPositionOpener.getUserOpenOrders(userAddress);
      const recentFills = await hyperliquidPositionOpener.getUserFills(userAddress);

      return {
        positions,
        openOrders,
        recentFills
      };
    } catch (error) {
      logger.error('Error getting Hyperliquid position status:', error);
      throw error;
    }
  }

  /**
   * Verify a Hyperliquid order on-chain
   * @param {number} orderId - The order ID to verify
   * @param {string} coin - The coin symbol
   * @returns {Promise<any>} The verification result
   */
  async verifyHyperliquidOrder(orderId: number, coin: string): Promise<any> {
    try {
      // Use the hardcoded testnet wallet address for verification
      const testnetWalletAddress = '0x8403C885370cEd907350556e798Bc6c499985dbB';
      return await hyperliquidPositionOpener.verifyOrderOnChain(orderId, coin, testnetWalletAddress);
    } catch (error) {
      logger.error('Error verifying Hyperliquid order:', error);
      throw error;
    }
  }
}