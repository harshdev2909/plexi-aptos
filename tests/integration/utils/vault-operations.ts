import { AptosVaultClient } from './aptos-client';
import { UserTransactionResponse } from '@aptos-labs/ts-sdk';

export class VaultOperations {
  constructor(private client: AptosVaultClient) {}

  // Initialize vault
  async initVault(assetToken: string = 'USDC', rebalanceCooldown: number = 3600): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::init_vault` as `${string}::${string}::${string}`,
      functionArguments: [assetToken, rebalanceCooldown.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Deposit assets
  async deposit(amount: number, receiver?: string): Promise<UserTransactionResponse> {
    const receiverAddress = receiver || this.client.getAccount().accountAddress.toString();
    
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::deposit` as `${string}::${string}::${string}`,
      functionArguments: [amount.toString(), receiverAddress]
    };

    return await this.client.executeTransaction(payload);
  }

  // Withdraw assets
  async withdraw(amount: number, receiver?: string, owner?: string): Promise<UserTransactionResponse> {
    const receiverAddress = receiver || this.client.getAccount().accountAddress.toString();
    const ownerAddress = owner || this.client.getAccount().accountAddress.toString();
    
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::withdraw` as `${string}::${string}::${string}`,
      functionArguments: [amount.toString(), receiverAddress, ownerAddress]
    };

    return await this.client.executeTransaction(payload);
  }

  // Mint shares
  async mint(shares: number, receiver?: string): Promise<UserTransactionResponse> {
    const receiverAddress = receiver || this.client.getAccount().accountAddress.toString();
    
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::mint` as `${string}::${string}::${string}`,
      functionArguments: [shares.toString(), receiverAddress]
    };

    return await this.client.executeTransaction(payload);
  }

  // Redeem shares
  async redeem(shares: number, receiver?: string, owner?: string): Promise<UserTransactionResponse> {
    const receiverAddress = receiver || this.client.getAccount().accountAddress.toString();
    const ownerAddress = owner || this.client.getAccount().accountAddress.toString();
    
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::redeem` as `${string}::${string}::${string}`,
      functionArguments: [shares.toString(), receiverAddress, ownerAddress]
    };

    return await this.client.executeTransaction(payload);
  }

  // Convert assets to shares - Note: These are not view functions in the current deployment
  async convertToShares(assets: number): Promise<number> {
    // For now, we'll simulate the conversion logic since these aren't view functions
    // In a real implementation, you'd need to make these entry functions or use a different approach
    const vaultState = await this.client.getVaultState();
    if (vaultState.totalShares === 0) {
      return assets; // 1:1 ratio for first deposit
    } else {
      return Math.floor((assets * vaultState.totalShares) / vaultState.totalAssets);
    }
  }

  // Convert shares to assets - Note: These are not view functions in the current deployment
  async convertToAssets(shares: number): Promise<number> {
    // For now, we'll simulate the conversion logic since these aren't view functions
    const vaultState = await this.client.getVaultState();
    if (vaultState.totalShares === 0) {
      return 0;
    } else {
      return Math.floor((shares * vaultState.totalAssets) / vaultState.totalShares);
    }
  }

  // Register strategy metadata
  async registerStrategy(
    strategyName: string, 
    riskLevel: number, 
    creator?: string
  ): Promise<UserTransactionResponse> {
    const creatorAddress = creator || this.client.getAccount().accountAddress.toString();
    
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::register_strategy_metadata` as `${string}::${string}::${string}`,
      functionArguments: [strategyName, riskLevel.toString(), creatorAddress]
    };

    return await this.client.executeTransaction(payload);
  }

  // Rebalance vault
  async rebalance(hedgeAllocation: number, farmAllocation: number): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::rebalance` as `${string}::${string}::${string}`,
      functionArguments: [hedgeAllocation.toString(), farmAllocation.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Trigger rebalance
  async triggerRebalance(hedgeAllocation: number, farmAllocation: number): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::trigger_rebalance` as `${string}::${string}::${string}`,
      functionArguments: [hedgeAllocation.toString(), farmAllocation.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Hedge with Hyperliquid
  async hedgeWithHyperliquid(
    strategyId: number, 
    amount: number, 
    direction: string
  ): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::hedge_with_hyperliquid` as `${string}::${string}::${string}`,
      functionArguments: [strategyId.toString(), amount.toString(), direction]
    };

    return await this.client.executeTransaction(payload);
  }

  // Farm with TAPP
  async farmWithTapp(strategyId: number, amount: number): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::farm_with_tapp` as `${string}::${string}::${string}`,
      functionArguments: [strategyId.toString(), amount.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Harvest yield
  async harvestYield(strategyId: number): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::harvest_yield` as `${string}::${string}::${string}`,
      functionArguments: [strategyId.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Add reward token
  async addRewardToken(rewardToken: string): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::add_reward_token` as `${string}::${string}::${string}`,
      functionArguments: [rewardToken]
    };

    return await this.client.executeTransaction(payload);
  }

  // Update reward per share
  async updateRewardPerShare(rewardToken: string, amount: number): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::update_reward_per_share` as `${string}::${string}::${string}`,
      functionArguments: [rewardToken, amount.toString()]
    };

    return await this.client.executeTransaction(payload);
  }

  // Route order to CLOB
  async routeOrderToClob(orderData: string): Promise<UserTransactionResponse> {
    const payload = {
      function: `${this.client.getConfig().vaultAddress}::vault::route_order_to_clob` as `${string}::${string}::${string}`,
      functionArguments: [orderData]
    };

    return await this.client.executeTransaction(payload);
  }

  // Get strategy metadata
  async getStrategyMetadata(strategyId: number): Promise<any> {
    const [metadata] = await this.client.callViewFunction('get_strategy_metadata', [
      this.client.getConfig().vaultAddress,
      strategyId.toString()
    ]);
    return metadata;
  }

  // Get strategy count
  async getStrategyCount(): Promise<number> {
    const [count] = await this.client.callViewFunction('get_strategy_count', [
      this.client.getConfig().vaultAddress
    ]);
    return parseInt(count);
  }

  // Get reward tokens
  async getRewardTokens(): Promise<string[]> {
    const [tokens] = await this.client.callViewFunction('get_reward_tokens', [
      this.client.getConfig().vaultAddress
    ]);
    return tokens as string[];
  }
}
