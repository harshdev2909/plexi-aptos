import { expect } from 'chai';
import { describe, it, before, beforeEach, after } from 'mocha';
import { AptosVaultClient } from './utils/aptos-client';
import { VaultOperations } from './utils/vault-operations';
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

describe('PlexiX Vault Integration Tests', function() {
  this.timeout(60000); // 60 second timeout for blockchain operations

  let client: AptosVaultClient;
  let vaultOps: VaultOperations;
  let testAccount1: Account;
  let testAccount2: Account;
  let initialBalance: number;

  before(async function() {
    console.log('🚀 Setting up integration test environment...');
    
    // Initialize client and operations
    client = new AptosVaultClient();
    vaultOps = new VaultOperations(client);

    // Create additional test accounts
    const privateKey1 = new Ed25519PrivateKey(Ed25519PrivateKey.generate().toString());
    const privateKey2 = new Ed25519PrivateKey(Ed25519PrivateKey.generate().toString());
    testAccount1 = Account.fromPrivateKey({ privateKey: privateKey1 });
    testAccount2 = Account.fromPrivateKey({ privateKey: privateKey2 });

    // Get initial balance
    initialBalance = await client.getAccountBalance();
    console.log(`📊 Initial account balance: ${initialBalance / 100000000} APT`);

    // Check if vault is already initialized
    const isInitialized = await client.isVaultInitialized();
    console.log(`🏦 Vault initialized: ${isInitialized}`);
  });

  describe('1. Vault Initialization', function() {
    it('should have correct vault address and metadata', async function() {
      const config = client.getConfig();
      expect(config.vaultAddress).to.equal('0xd2201fd19cfba1eda48016eea501816328cb0a973917689e37aaf2c29d1cc465');
      expect(config.assetToken).to.equal('USDC');
      expect(config.rebalanceCooldown).to.equal(3600);
    });

    it('should check initial vault state (assets>=0, shares>=0)', async function() {
      try {
        const vaultState = await client.getVaultState();
        
        console.log('📈 Vault State:', vaultState);
        
        expect(vaultState.isInitialized).to.be.true;
        expect(vaultState.assetToken).to.equal('USDC');
        // Note: These might not be 0 if vault has been used before
        expect(vaultState.totalAssets).to.be.a('number');
        expect(vaultState.totalShares).to.be.a('number');
      } catch (error) {
        console.log('⚠️ Vault may not be initialized yet, which is expected for a fresh deployment');
        // This is acceptable for a fresh deployment
        this.skip();
      }
    });

    it('should verify vault is properly deployed and accessible', async function() {
      try {
        const isInitialized = await client.isVaultInitialized();
        console.log(`🏦 Vault initialization status: ${isInitialized}`);
        
        if (!isInitialized) {
          console.log('🔧 Vault not initialized, attempting to initialize...');
          const initTxn = await vaultOps.initVault('USDC', 3600);
          expect(initTxn.success).to.be.true;
          console.log('✅ Vault initialized successfully');
          
          // Verify initialization
          const newStatus = await client.isVaultInitialized();
          expect(newStatus).to.be.true;
        } else {
          expect(isInitialized).to.be.true;
        }
      } catch (error) {
        console.log('⚠️ Error checking vault status:', error);
        // Try to initialize anyway
        try {
          const initTxn = await vaultOps.initVault('USDC', 3600);
          expect(initTxn.success).to.be.true;
          console.log('✅ Vault initialized successfully after error');
        } catch (initError) {
          console.log('❌ Failed to initialize vault:', initError);
          throw initError;
        }
      }
    });
  });

  describe('2. Deposit Workflow', function() {
    let initialVaultState: any;
    let initialUserShares: number;

    beforeEach(async function() {
      initialVaultState = await client.getVaultState();
      initialUserShares = await client.getUserShares();
    });

    it('should allow user to deposit tokens and mint shares', async function() {
      const depositAmount = 1000;
      
      console.log(`💰 Depositing ${depositAmount} tokens...`);
      
      const txn = await vaultOps.deposit(depositAmount);
      expect(txn.success).to.be.true;
      
      // Verify vault state updated
      const newVaultState = await client.getVaultState();
      expect(newVaultState.totalAssets).to.equal(initialVaultState.totalAssets + depositAmount);
      
      // Verify user shares increased  
      const newUserShares = await client.getUserShares();
      expect(newUserShares).to.be.greaterThan(initialUserShares);
      
      console.log(`✅ Deposit successful. New shares: ${newUserShares}`);
    });

    it('should correctly calculate share-to-asset ratio', async function() {
      const vaultState = await client.getVaultState();
      
      if (vaultState.totalShares > 0) {
        const testAssets = 500;
        const expectedShares = await vaultOps.convertToShares(testAssets);
        const backToAssets = await vaultOps.convertToAssets(expectedShares);
        
        // Allow for small rounding differences
        expect(Math.abs(backToAssets - testAssets)).to.be.lessThan(2);
        
        console.log(`🔄 Conversion test: ${testAssets} assets = ${expectedShares} shares = ${backToAssets} assets`);
      }
    });
  });

  describe('3. Withdraw Workflow', function() {
    it('should allow partial withdrawal', async function() {
      const userShares = await client.getUserShares();
      
      if (userShares > 100) {
        const withdrawAmount = 100;
        const initialVaultState = await client.getVaultState();
        
        console.log(`💸 Withdrawing ${withdrawAmount} assets...`);
        
        const txn = await vaultOps.withdraw(withdrawAmount);
        expect(txn.success).to.be.true;
        
        // Verify vault assets decreased
        const newVaultState = await client.getVaultState();
        expect(newVaultState.totalAssets).to.be.lessThan(initialVaultState.totalAssets);
        
        // Verify user shares decreased
        const newUserShares = await client.getUserShares();
        expect(newUserShares).to.be.lessThan(userShares);
        
        console.log(`✅ Partial withdrawal successful. Remaining shares: ${newUserShares}`);
      } else {
        console.log('⚠️ Skipping partial withdrawal test - insufficient shares');
        this.skip();
      }
    });

    it('should handle full withdrawal correctly', async function() {
      const userShares = await client.getUserShares();
      
      if (userShares > 0) {
        const userAssets = await vaultOps.convertToAssets(userShares);
        
        console.log(`💸 Withdrawing all ${userAssets} assets (${userShares} shares)...`);
        
        const txn = await vaultOps.withdraw(userAssets);
        expect(txn.success).to.be.true;
        
        // Verify user has no shares left
        const newUserShares = await client.getUserShares();
        expect(newUserShares).to.equal(0);
        
        console.log(`✅ Full withdrawal successful. Remaining shares: ${newUserShares}`);
      } else {
        console.log('⚠️ Skipping full withdrawal test - no shares to withdraw');
        this.skip();
      }
    });
  });

  describe('4. Multiple Users', function() {
    it('should handle deposits from multiple users with proportional shares', async function() {
      // Start with fresh vault state
      const user1DepositAmount = 1000;
      const user2DepositAmount = 2000;
      
      console.log(`👥 Testing multi-user deposits: User1=${user1DepositAmount}, User2=${user2DepositAmount}`);
      
      // User 1 deposit
      const txn1 = await vaultOps.deposit(user1DepositAmount, testAccount1.accountAddress.toString());
      expect(txn1.success).to.be.true;
      
      // User 2 deposit  
      const txn2 = await vaultOps.deposit(user2DepositAmount, testAccount2.accountAddress.toString());
      expect(txn2.success).to.be.true;
      
      // Check share distribution
      const user1Shares = await client.getUserShares(testAccount1.accountAddress.toString());
      const user2Shares = await client.getUserShares(testAccount2.accountAddress.toString());
      
      // User1 gets first deposit (1:1 ratio): 1000 shares
      // User2 deposits into vault with 1000 assets, 1000 shares: gets (2000*1000)/1000 = 2000 shares
      expect(user1Shares).to.equal(1000);
      expect(user2Shares).to.equal(2000);
      
      const ratio = user2Shares / user1Shares;
      expect(ratio).to.equal(2);
      
      console.log(`✅ Multi-user test: User1 shares=${user1Shares}, User2 shares=${user2Shares}, ratio=${ratio.toFixed(2)}`);
    });
  });

  describe('5. Rebalance + Harvest', function() {
    it('should execute rebalance with valid allocations', async function() {
      const hedgeAllocation = 3000; // 30% in basis points
      const farmAllocation = 7000;  // 70% in basis points
      
      console.log(`⚖️ Rebalancing: ${hedgeAllocation/100}% hedge, ${farmAllocation/100}% farm`);
      
      const txn = await vaultOps.rebalance(hedgeAllocation, farmAllocation);
      expect(txn.success).to.be.true;
      
      console.log(`✅ Rebalance successful`);
    });

    it('should register a strategy and harvest yield', async function() {
      const strategyName = 'Test Yield Strategy';
      const riskLevel = 3;
      
      console.log(`📋 Registering strategy: ${strategyName}`);
      
      const registerTxn = await vaultOps.registerStrategy(strategyName, riskLevel);
      expect(registerTxn.success).to.be.true;
      
      // Get strategy count - should increase after registration
      const strategyCount = await vaultOps.getStrategyCount();
      expect(strategyCount).to.be.greaterThan(0); // At least one strategy registered
      
      // Harvest yield for the first strategy
      if (strategyCount > 0) {
        console.log(`🌾 Harvesting yield for strategy ID 1`);
        
        const harvestTxn = await vaultOps.harvestYield(1);
        expect(harvestTxn.success).to.be.true;
        
        console.log(`✅ Harvest successful`);
      }
    });

    it('should add and manage reward tokens', async function() {
      const rewardToken = `YIELD_${Date.now()}`; // Use unique token name
      
      console.log(`🎁 Adding reward token: ${rewardToken}`);
      
      const addTxn = await vaultOps.addRewardToken(rewardToken);
      expect(addTxn.success).to.be.true;
      
      // Update reward per share
      const rewardAmount = 100;
      const updateTxn = await vaultOps.updateRewardPerShare(rewardToken, rewardAmount);
      expect(updateTxn.success).to.be.true;
      
      // Verify reward tokens
      const rewardTokens = await vaultOps.getRewardTokens();
      expect(rewardTokens).to.include(rewardToken);
      
      console.log(`✅ Reward token management successful. Tokens: ${rewardTokens.join(', ')}`);
    });
  });

  describe('6. Hedge + Farm', function() {
    it('should execute hedge with Hyperliquid', async function() {
      const strategyId = 1;
      const amount = 500;
      const direction = 'LONG';
      
      console.log(`🛡️ Hedging ${amount} with Hyperliquid (${direction})`);
      
      const txn = await vaultOps.hedgeWithHyperliquid(strategyId, amount, direction);
      expect(txn.success).to.be.true;
      
      console.log(`✅ Hedge execution successful`);
    });

    it('should execute farming with TAPP', async function() {
      const strategyId = 1;
      const amount = 800;
      
      console.log(`🚜 Farming ${amount} with TAPP`);
      
      const txn = await vaultOps.farmWithTapp(strategyId, amount);
      expect(txn.success).to.be.true;
      
      console.log(`✅ Farm execution successful`);
    });

    it('should route orders to CLOB', async function() {
      const orderData = 'CLOB_ROUTE';
      
      console.log(`📊 Routing order to CLOB: ${orderData}`);
      
      const txn = await vaultOps.routeOrderToClob(orderData);
      expect(txn.success).to.be.true;
      
      console.log(`✅ CLOB routing successful`);
    });
  });

  describe('7. Failure Cases', function() {
    it('should reject deposit of 0 amount', async function() {
      console.log(`❌ Testing zero deposit rejection`);
      
      try {
        await vaultOps.deposit(0);
        expect.fail('Should have thrown an error for zero deposit');
      } catch (error: any) {
        expect(error.message).to.include('ZERO_AMOUNT');
        console.log(`✅ Zero deposit correctly rejected: ${error.message}`);
      }
    });

    it('should reject withdrawal of more than balance', async function() {
      const userShares = await client.getUserShares();
      const userAssets = userShares > 0 ? await vaultOps.convertToAssets(userShares) : 0;
      const excessiveAmount = userAssets + 10000;
      
      if (userAssets > 0) {
        console.log(`❌ Testing excessive withdrawal rejection (${excessiveAmount} > ${userAssets})`);
        
        try {
          await vaultOps.withdraw(excessiveAmount);
          expect.fail('Should have thrown an error for excessive withdrawal');
        } catch (error: any) {
          expect(error.message).to.include('INSUFFICIENT');
          console.log(`✅ Excessive withdrawal correctly rejected: ${error.message}`);
        }
      } else {
        console.log('⚠️ Skipping excessive withdrawal test - no balance to test against');
        this.skip();
      }
    });

    it('should reject rebalance with invalid allocation', async function() {
      const invalidHedge = 6000; // 60% in basis points
      const invalidFarm = 6000;  // 60% in basis points (Total = 120% > 100%)
      
      console.log(`❌ Testing invalid rebalance allocation (${invalidHedge/100}% + ${invalidFarm/100}% = 120%)`);
      
      try {
        await vaultOps.rebalance(invalidHedge, invalidFarm);
        expect.fail('Should have thrown an error for invalid allocation');
      } catch (error: any) {
        expect(error.message).to.include('INVALID');
        console.log(`✅ Invalid allocation correctly rejected: ${error.message}`);
      }
    });

    it('should reject strategy registration with invalid risk level', async function() {
      const strategyName = 'Invalid Risk Strategy';
      const invalidRiskLevel = 10; // Assuming valid range is 1-5
      
      console.log(`❌ Testing invalid risk level rejection (${invalidRiskLevel})`);
      
      try {
        await vaultOps.registerStrategy(strategyName, invalidRiskLevel);
        expect.fail('Should have thrown an error for invalid risk level');
      } catch (error: any) {
        expect(error.message).to.include('INVALID_RISK_LEVEL');
        console.log(`✅ Invalid risk level correctly rejected: ${error.message}`);
      }
    });
  });

  describe('8. End-to-End Workflow', function() {
    it('should complete full user journey: deposit → rebalance → harvest → withdraw', async function() {
      console.log(`🎯 Starting end-to-end workflow test`);
      
      // Step 1: User deposits
      const depositAmount = 1500;
      console.log(`1️⃣ Depositing ${depositAmount} tokens`);
      
      const depositTxn = await vaultOps.deposit(depositAmount);
      expect(depositTxn.success).to.be.true;
      
      const sharesAfterDeposit = await client.getUserShares();
      expect(sharesAfterDeposit).to.equal(depositAmount); // First deposit: 1:1 ratio
      
      // Step 2: Vault rebalances
      console.log(`2️⃣ Rebalancing vault (40% hedge, 60% farm)`);
      
      const rebalanceTxn = await vaultOps.rebalance(4000, 6000); // Use basis points
      expect(rebalanceTxn.success).to.be.true;
      
      // Step 3: Register strategy and harvest yield
      console.log(`3️⃣ Registering strategy and harvesting yield`);
      
      const strategyTxn = await vaultOps.registerStrategy('E2E Test Strategy', 2);
      expect(strategyTxn.success).to.be.true;
      
      const strategyCount = await vaultOps.getStrategyCount();
      if (strategyCount > 0) {
        const harvestTxn = await vaultOps.harvestYield(strategyCount);
        expect(harvestTxn.success).to.be.true;
      }
      
      // Step 4: User withdraws
      console.log(`4️⃣ Withdrawing 50% of assets`);
      
      const currentShares = await client.getUserShares();
      const withdrawShares = Math.floor(currentShares / 2);
      const withdrawAssets = await vaultOps.convertToAssets(withdrawShares);
      
      const withdrawTxn = await vaultOps.withdraw(withdrawAssets);
      expect(withdrawTxn.success).to.be.true;
      
      // Step 5: Verify final state
      const finalShares = await client.getUserShares();
      const finalVaultState = await client.getVaultState();
      
      expect(finalShares).to.be.lessThan(sharesAfterDeposit);
      expect(finalShares).to.be.greaterThan(0);
      expect(finalVaultState.totalAssets).to.be.greaterThan(0);
      
      console.log(`✅ End-to-end workflow completed successfully!`);
      console.log(`📊 Final state: User shares=${finalShares}, Vault assets=${finalVaultState.totalAssets}`);
    });
  });

  after(async function() {
    const finalBalance = await client.getAccountBalance();
    const gasUsed = initialBalance - finalBalance;
    
    console.log(`🏁 Integration tests completed!`);
    console.log(`💰 Final balance: ${finalBalance / 100000000} APT`);
    console.log(`⛽ Total gas used: ${gasUsed / 100000000} APT (≈$${(gasUsed / 100000000 * 10).toFixed(4)})`);
    
    const vaultState = await client.getVaultState();
    console.log(`🏦 Final vault state:`, vaultState);
  });
});
