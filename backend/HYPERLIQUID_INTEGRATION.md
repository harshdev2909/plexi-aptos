# Hyperliquid Integration for Plexi Vault

This document describes the integration of Hyperliquid position opening functionality into the Plexi Vault system.

## Overview

When a user successfully deposits APT tokens into the Plexi Vault, the system automatically opens a corresponding position on Hyperliquid with the same APT amount using the hardcoded testnet credentials.

## Features

- **Automatic Position Opening**: Positions are opened automatically when APT deposits are successful
- **APT/USD Trading**: Currently configured to trade APT/USD perpetuals at current market price (~$4.22)
- **1:1 APT Matching**: Hyperliquid position matches the exact APT amount deposited
- **Error Handling**: Hyperliquid failures don't affect vault deposits
- **Order Verification**: Built-in order verification and status checking
- **API Endpoints**: RESTful endpoints for monitoring positions and orders

## Configuration

### Hardcoded Testnet Credentials

```typescript
const TESTNET_CONFIG = {
  privateKey: '0x95723ed55563c522b976f1000f6ab2fa544363109eee34d6cb7b3cac56ed98cb',
  testnet: true,
  walletAddress: '0x8403C885370cEd907350556e798Bc6c499985dbB'
};
```

### Trading Parameters

- **Coin**: APT (Aptos)
- **Price**: $11.00 (hardcoded for testnet)
- **Order Type**: IOC (Immediate or Cancel)
- **Slippage**: 15 basis points (0.15%)

## API Endpoints

### Deposit with Hyperliquid Integration

```http
POST /vault/deposit
Content-Type: application/json

{
  "walletAddress": "0x...",
  "amount": 110
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "sharesMinted": 11000,
    "hyperliquidOrderId": 12345,
    "hyperliquidSuccess": true,
    "user": {
      "walletAddress": "0x...",
      "shares": 11000
    }
  }
}
```

### Get Hyperliquid Position Status

```http
GET /vault/hyperliquid/positions/:address
```

**Response:**
```json
{
  "success": true,
  "data": {
    "positions": [...],
    "openOrders": [...],
    "recentFills": [...]
  }
}
```

### Verify Hyperliquid Order

```http
GET /vault/hyperliquid/verify/:orderId?coin=APT
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderFound": true,
    "recentFills": [...],
    "ourFill": {...}
  }
}
```

## Implementation Details

### 1. HyperliquidPositionOpener Service

Located at: `src/services/hyperliquid-position-opener.ts`

Key methods:
- `openPositionOnDeposit()`: Main method for opening positions on deposits
- `placeIocPerpOrder()`: Places IOC orders on Hyperliquid
- `verifyOrderOnChain()`: Verifies orders on-chain
- `calculateHedgeAmount()`: Calculates position sizes

### 2. Vault Service Integration

Located at: `src/services/vault-service.ts`

Modified methods:
- `recordDeposit()`: Now includes Hyperliquid position opening
- `getHyperliquidPositionStatus()`: Get user's Hyperliquid status
- `verifyHyperliquidOrder()`: Verify specific orders

### 3. API Routes

Located at: `src/routes/vault.ts`

New endpoints:
- `GET /vault/hyperliquid/positions/:address`
- `GET /vault/hyperliquid/verify/:orderId`

## Testing

### Run Integration Tests

```bash
# Install dependencies
npm install hyperliquid

# Run the test script
npx ts-node src/scripts/test-hyperliquid.ts

# Run unit tests
npm test -- --testPathPattern=hyperliquid-integration
```

### Test Scenarios

1. **Deposit Flow**: Test that deposits trigger Hyperliquid positions
2. **Position Monitoring**: Verify position status endpoints work
3. **Order Verification**: Test order verification functionality
4. **Error Handling**: Ensure Hyperliquid failures don't break deposits

## Error Handling

The integration includes comprehensive error handling:

- **Hyperliquid API Failures**: Don't affect vault deposits
- **Network Issues**: Graceful degradation
- **Order Failures**: Logged but don't block deposits
- **Verification Failures**: Return appropriate error messages

## Monitoring

### Logs

All Hyperliquid operations are logged with:
- Order placement attempts
- Success/failure status
- Order IDs and verification results
- Error details for debugging

### Metrics

Track the following metrics:
- Deposit success rate
- Hyperliquid position opening success rate
- Order verification success rate
- Average order execution time

## Security Considerations

- **Private Key**: Currently hardcoded for testnet (NOT for production)
- **API Keys**: Use environment variables in production
- **Rate Limiting**: Implement rate limiting for Hyperliquid API calls
- **Error Logging**: Avoid logging sensitive information

## Production Deployment

### Environment Variables

```bash
HYPERLIQUID_PRIVATE_KEY=your-production-private-key
HYPERLIQUID_TESTNET_ENABLED=false
HYPERLIQUID_WALLET_ADDRESS=your-production-wallet
```

### Configuration Changes

1. Replace hardcoded credentials with environment variables
2. Update wallet addresses for production
3. Adjust trading parameters for mainnet
4. Implement proper error handling and monitoring

## Troubleshooting

### Common Issues

1. **Module Not Found**: Ensure `hyperliquid` package is installed
2. **API Failures**: Check network connectivity and credentials
3. **Order Failures**: Verify sufficient balance and market conditions
4. **Verification Issues**: Check order IDs and timing

### Debug Commands

```bash
# Check Hyperliquid connection
curl -X GET "http://localhost:3000/vault/hyperliquid/positions/0x8403C885370cEd907350556e798Bc6c499985dbB"

# Verify specific order
curl -X GET "http://localhost:3000/vault/hyperliquid/verify/12345?coin=APT"
```

## Future Enhancements

1. **Multiple Assets**: Support for trading multiple cryptocurrencies
2. **Dynamic Pricing**: Real-time price feeds instead of hardcoded prices
3. **Risk Management**: Position sizing based on risk parameters
4. **Advanced Orders**: Support for stop-loss and take-profit orders
5. **Portfolio Management**: Automatic rebalancing across multiple positions

## Support

For issues related to Hyperliquid integration:

1. Check the logs for detailed error messages
2. Verify API credentials and network connectivity
3. Test with small amounts first
4. Monitor Hyperliquid dashboard for order status
5. Use the verification endpoints to check order status

## Changelog

- **v1.0.0**: Initial Hyperliquid integration
  - Automatic position opening on deposits
  - APT/USD trading at $11 on testnet
  - Order verification and monitoring
  - API endpoints for position management
