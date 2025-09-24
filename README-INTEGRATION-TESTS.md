# PlexiX Vault Integration Tests

This directory contains comprehensive integration tests for the PlexiX Vault Protocol deployed on Aptos Testnet.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the environment template and fill in your values:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```bash
# Aptos Network Configuration
RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
NETWORK=testnet

# Contract Configuration  
VAULT_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2

# Test Account Configuration
PRIVATE_KEY=ed25519-priv-0xb7df2a949da45a3b1f90047c1a7fcaec00764efe69b68e7abc7ad028b6e5d726
PUBLIC_KEY=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2

# Test Configuration
TEST_TIMEOUT=30000
GAS_UNIT_PRICE=100
MAX_GAS_AMOUNT=10000

# Asset Configuration
ASSET_TOKEN=USDC
REBALANCE_COOLDOWN=3600
```

### 3. Run Tests
```bash
# Run all integration tests
npm test

# Run tests with verbose output
npm run test:verbose

# Run tests in watch mode
npm run test:watch
```

## 📋 Test Coverage

### 1. Vault Initialization Tests
- ✅ Verify vault address and metadata
- ✅ Check initial state (assets=0, shares=0)
- ✅ Confirm vault is properly deployed and accessible

### 2. Deposit Workflow Tests
- ✅ User deposits tokens and receives shares
- ✅ Vault totalAssets increases correctly
- ✅ Share-to-asset ratio calculations
- ✅ Multiple deposit scenarios

### 3. Withdraw Workflow Tests
- ✅ Partial withdrawal functionality
- ✅ Full withdrawal functionality
- ✅ Correct asset return calculations
- ✅ Share burning verification

### 4. Multiple Users Tests
- ✅ Two users deposit different amounts
- ✅ Proportional share distribution
- ✅ Independent user balance tracking

### 5. Rebalance + Harvest Tests
- ✅ Execute rebalance with valid allocations
- ✅ Strategy registration and management
- ✅ Yield harvesting functionality
- ✅ Reward token management

### 6. Hedge + Farm Tests
- ✅ Hedge with Hyperliquid integration
- ✅ Farm with TAPP integration
- ✅ CLOB order routing
- ✅ Strategy execution verification

### 7. Failure Cases Tests
- ✅ Reject deposit of 0 amount
- ✅ Reject withdrawal exceeding balance
- ✅ Reject invalid rebalance allocations
- ✅ Reject invalid strategy parameters

### 8. End-to-End Workflow Tests
- ✅ Complete user journey: deposit → rebalance → harvest → withdraw
- ✅ State consistency throughout workflow
- ✅ Final balance verification

## 🏗️ Architecture

### Core Components

#### `AptosVaultClient`
- Manages RPC connection to Aptos network
- Handles account management and authentication
- Provides utility methods for blockchain interactions
- Supports view function calls and transaction execution

#### `VaultOperations`
- High-level wrapper for vault contract functions
- Simplifies complex transaction building
- Provides type-safe function calls
- Handles error cases and validation

### Test Structure
```
tests/integration/
├── utils/
│   ├── aptos-client.ts     # Core Aptos blockchain client
│   └── vault-operations.ts # Vault-specific operations wrapper
└── vault.test.ts           # Main integration test suite
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Aptos RPC endpoint | `https://fullnode.testnet.aptoslabs.com/v1` |
| `NETWORK` | Aptos network | `testnet` |
| `VAULT_ADDRESS` | Deployed vault contract address | Your deployed address |
| `PRIVATE_KEY` | Test account private key | Your private key |
| `PUBLIC_KEY` | Test account public key | Your public key |
| `GAS_UNIT_PRICE` | Gas price for transactions | `100` |
| `MAX_GAS_AMOUNT` | Maximum gas per transaction | `10000` |

### Test Configuration
- **Timeout**: 60 seconds per test (blockchain operations can be slow)
- **Reporter**: Spec reporter for detailed output
- **Framework**: Mocha + Chai for assertions
- **TypeScript**: Full TypeScript support with ts-node

## 📊 Sample Test Output

```
🚀 Setting up integration test environment...
📊 Initial account balance: 1.99459600 APT
🏦 Vault initialized: true

  PlexiX Vault Integration Tests
    1. Vault Initialization
      ✓ should have correct vault address and metadata
      ✓ should check initial vault state (assets=0, shares=0)
      ✓ should verify vault is properly deployed and accessible

    2. Deposit Workflow
      💰 Depositing 1000 tokens...
      ✅ Deposit successful. New shares: 1000
      ✓ should allow user to deposit tokens and mint shares
      🔄 Conversion test: 500 assets = 500 shares = 500 assets
      ✓ should correctly calculate share-to-asset ratio

    3. Withdraw Workflow
      💸 Withdrawing 100 assets...
      ✅ Partial withdrawal successful. Remaining shares: 900
      ✓ should allow partial withdrawal
      💸 Withdrawing all 900 assets (900 shares)...
      ✅ Full withdrawal successful. Remaining shares: 0
      ✓ should handle full withdrawal correctly

    [... more test results ...]

🏁 Integration tests completed!
💰 Final balance: 1.98234567 APT
⛽ Total gas used: 0.01225033 APT (≈$0.1225)
🏦 Final vault state: { totalAssets: 2000, totalShares: 2000, assetToken: 'USDC', isInitialized: true }

  ✓ 24 passing (45s)
```

## 🚨 Error Handling

The tests include comprehensive error handling for:
- Network connectivity issues
- Transaction failures
- Invalid parameters
- Insufficient balances
- Contract state inconsistencies

## 🔍 Debugging

### Enable Verbose Logging
```bash
DEBUG=* npm test
```

### Check Individual Test Cases
```bash
npx mocha --grep "Deposit Workflow" tests/integration/vault.test.ts
```

### Verify Contract State
The tests include detailed logging of:
- Transaction hashes
- Gas usage
- Vault state changes
- User balance changes
- Error messages

## 🛠️ Extending Tests

To add new test cases:

1. **Add new test function**:
```typescript
it('should test new functionality', async function() {
  // Your test logic here
  const result = await vaultOps.newFunction();
  expect(result.success).to.be.true;
});
```

2. **Add new vault operation**:
```typescript
// In vault-operations.ts
async newFunction(): Promise<UserTransactionResponse> {
  const payload = {
    function: `${this.client.getConfig().vaultAddress}::vault::new_function`,
    functionArguments: []
  };
  return await this.client.executeTransaction(payload);
}
```

3. **Update environment configuration** if needed

## 📈 Performance Considerations

- Tests run sequentially to avoid state conflicts
- Each test includes proper setup and cleanup
- Gas usage is monitored and reported
- Network timeouts are configured appropriately
- Test data is isolated per test case

## 🔐 Security Notes

- Private keys are loaded from environment variables
- Test accounts should only be used on testnet
- Never commit private keys to version control
- Use separate accounts for testing vs production

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Include proper error handling
3. Add descriptive console logging
4. Update this README with new test coverage
5. Ensure tests are deterministic and can run independently

## 📞 Support

For issues with integration tests:
1. Check your environment configuration
2. Verify your account has sufficient APT balance
3. Confirm the vault contract is deployed correctly
4. Check network connectivity to Aptos testnet
5. Review test logs for specific error messages
