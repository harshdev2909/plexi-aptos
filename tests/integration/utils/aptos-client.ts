import { 
  Aptos, 
  AptosConfig, 
  Network, 
  Account, 
  Ed25519PrivateKey,
  InputEntryFunctionData,
  PendingTransactionResponse,
  UserTransactionResponse
} from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface VaultConfig {
  rpcUrl: string;
  network: Network;
  vaultAddress: string;
  privateKey: string;
  publicKey: string;
  assetToken: string;
  rebalanceCooldown: number;
  gasUnitPrice: number;
  maxGasAmount: number;
}

export class AptosVaultClient {
  private aptos: Aptos;
  private account: Account;
  private config: VaultConfig;

  constructor() {
    this.config = {
      rpcUrl: process.env.RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
      network: (process.env.NETWORK as Network) || Network.TESTNET,
      vaultAddress: process.env.VAULT_ADDRESS || '0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2',
      privateKey: process.env.PRIVATE_KEY || 'ed25519-priv-0xb7df2a949da45a3b1f90047c1a7fcaec00764efe69b68e7abc7ad028b6e5d726',
      publicKey: process.env.PUBLIC_KEY || '0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2',
      assetToken: process.env.ASSET_TOKEN || 'USDC',
      rebalanceCooldown: parseInt(process.env.REBALANCE_COOLDOWN || '3600'),
      gasUnitPrice: parseInt(process.env.GAS_UNIT_PRICE || '100'),
      maxGasAmount: parseInt(process.env.MAX_GAS_AMOUNT || '10000')
    };

    // Initialize Aptos client
    const aptosConfig = new AptosConfig({ 
      network: this.config.network,
      fullnode: this.config.rpcUrl
    });
    this.aptos = new Aptos(aptosConfig);

    // Initialize account from private key
    const privateKey = new Ed25519PrivateKey(this.config.privateKey.replace('ed25519-priv-', ''));
    this.account = Account.fromPrivateKey({ privateKey });
  }

  getConfig(): VaultConfig {
    return this.config;
  }

  getAccount(): Account {
    return this.account;
  }

  getAptos(): Aptos {
    return this.aptos;
  }

  // Helper method to execute a transaction and wait for confirmation
  async executeTransaction(payload: InputEntryFunctionData): Promise<UserTransactionResponse> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: payload,
        options: {
          gasUnitPrice: this.config.gasUnitPrice,
          maxGasAmount: this.config.maxGasAmount,
        }
      });

      const pendingTxn = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction
      });

      const response = await this.aptos.waitForTransaction({
        transactionHash: pendingTxn.hash,
        options: {
          timeoutSecs: 30,
          checkSuccess: true
        }
      });

      return response as UserTransactionResponse;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Helper method to call view functions
  async callViewFunction(functionName: string, args: any[] = [], typeArgs: string[] = []): Promise<any> {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${this.config.vaultAddress}::vault::${functionName}` as `${string}::${string}::${string}`,
          functionArguments: args,
          typeArguments: typeArgs
        }
      });
      return result;
    } catch (error) {
      console.error(`View function ${functionName} failed:`, error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(accountAddress?: string): Promise<number> {
    const address = accountAddress || this.account.accountAddress.toString();
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: address
      });
      
      const coinResource = resources.find(
        (resource) => resource.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      if (coinResource && coinResource.data) {
        return parseInt((coinResource.data as any).coin.value);
      }
      return 0;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 0;
    }
  }

  // Check if vault is initialized
  async isVaultInitialized(): Promise<boolean> {
    try {
      const result = await this.callViewFunction('is_initialized', [this.config.vaultAddress]);
      return result[0] as boolean;
    } catch (error) {
      return false;
    }
  }

  // Get vault state
  async getVaultState(): Promise<{
    totalAssets: number;
    totalShares: number;
    assetToken: string;
    isInitialized: boolean;
  }> {
    try {
      const [totalAssets] = await this.callViewFunction('total_assets', [this.config.vaultAddress]);
      const [totalShares] = await this.callViewFunction('total_shares', [this.config.vaultAddress]);
      const [assetToken] = await this.callViewFunction('get_asset_token', [this.config.vaultAddress]);
      const [isInitialized] = await this.callViewFunction('is_initialized', [this.config.vaultAddress]);

      return {
        totalAssets: parseInt(totalAssets),
        totalShares: parseInt(totalShares),
        assetToken: assetToken,
        isInitialized: isInitialized
      };
    } catch (error) {
      console.error('Failed to get vault state:', error);
      throw error;
    }
  }

  // Get user shares
  async getUserShares(userAddress?: string): Promise<number> {
    const address = userAddress || this.account.accountAddress.toString();
    try {
      const [shares] = await this.callViewFunction('get_user_shares', [this.config.vaultAddress, address]);
      return parseInt(shares);
    } catch (error) {
      console.error('Failed to get user shares:', error);
      return 0;
    }
  }
}
