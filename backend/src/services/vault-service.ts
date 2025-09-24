import { Aptos, AptosConfig, Network, Ed25519PrivateKey, Ed25519PublicKey, Account } from '@aptos-labs/ts-sdk';
import { logger } from '../utils/logger';

export interface VaultState {
  totalAssets: number;
  totalShares: number;
  sharePrice: number;
}

export interface DepositResult {
  txHash: string;
  sharesMinted: number;
  success: boolean;
}

export interface WithdrawResult {
  txHash: string;
  amountWithdrawn: number;
  success: boolean;
}

export class VaultService {
  private aptos: Aptos;
  private vaultModuleAddress: string;
  private vaultModuleName: string;
  private vaultAccount: Account | null = null;

  constructor() {
    const config = new AptosConfig({
      network: Network.TESTNET,
      fullnode: process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
    });
    
    this.aptos = new Aptos(config);
    this.vaultModuleAddress = process.env.VAULT_MODULE_ADDRESS || '0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2';
    this.vaultModuleName = process.env.VAULT_MODULE_NAME || 'vault_v2';
    
    logger.info('Vault service initialized - using user wallets from frontend');
  }

  /**
   * Get the current vault state from the smart contract
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

      const assets = Number(totalAssets || 0);
      const shares = Number(totalShares || 0);
      const sharePrice = shares > 0 ? assets / shares : 0;

      logger.info(`Real vault state from contract: ${assets} assets, ${shares} shares, ${sharePrice} price`);
      
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
      
      // Get all users and their total shares
      const users = await User.find({});
      const totalShares = users.reduce((sum, user) => sum + user.shares, 0);
      
      // Get all completed deposits to calculate total assets
      const deposits = await TransactionModel.find({ 
        type: 'deposit', 
        status: 'completed' 
      });
      const withdrawals = await TransactionModel.find({ 
        type: 'withdraw', 
        status: 'completed' 
      });
      
      const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);
      const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
      const totalAssets = totalDeposits - totalWithdrawals;
      
      const sharePrice = totalShares > 0 ? totalAssets / totalShares : 1.0;

      return {
        totalAssets: Math.max(0, totalAssets),
        totalShares: Math.max(0, totalShares),
        sharePrice
      };
    }
  }

  /**
   * Get user's shares from the smart contract
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

      const userShares = Number(shares || 0);
      logger.info(`Real user shares from contract: ${userShares} for ${walletAddress}`);
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
   */
  async recordDeposit(walletAddress: string, amount: number, txHash: string): Promise<DepositResult> {
    try {
      logger.info(`Recording deposit: ${txHash} for ${amount} USDC from user wallet ${walletAddress}`);

      return {
        txHash,
        sharesMinted: amount,
        success: true
      };
    } catch (error) {
      logger.error('Error recording deposit:', error);
      throw error;
    }
  }

  /**
   * Record a withdrawal transaction (called after blockchain transaction is confirmed)
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
   * Get transaction details from Aptos
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
   * Wait for transaction confirmation
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
}