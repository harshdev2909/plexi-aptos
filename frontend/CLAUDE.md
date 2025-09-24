# Plexi Aptos Project - Claude Code Configuration

## Project Overview
- **Frontend**: React + TypeScript running on port 8080
- **Backend**: Node.js + TypeScript running on port 3001
- **Authentication**: Wallet-based auth using Petra wallet with JWT tokens
- **Blockchain**: Aptos testnet integration

## Quick Start Commands

### Backend Development
```bash
# Start backend server
cd backend && npm run dev

# Check backend health
curl http://localhost:3001/api/v1/health
```

### Frontend Development
```bash
# Start frontend development server
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build
```

### Authentication Testing
```bash
# Test nonce generation
curl -X POST http://localhost:3001/api/v1/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x5b506d41bf3d98e541f825b440184af8a162cd50f1b4c05c0097fdd1560b23f4"}'

# Test signature verification
curl -X POST http://localhost:3001/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"address":"0x5b506d41bf3d98e541f825b440184af8a162cd50f1b4c05c0097fdd1560b23f4","signature":"mock-signature-123"}'
```

## Common Issues & Fixes

### 1. ERR_CONNECTION_REFUSED
**Problem**: Frontend can't connect to backend
**Solution**:
- Check if backend is running: `ps aux | grep "ts-node-dev"`
- Verify port configuration in frontend/.env: `VITE_API_URL=http://localhost:3001/api/v1`
- Restart backend: `cd backend && npm run dev`

### 2. Auth Nonce Request Failed
**Problem**: Authentication fails with nonce request error
**Fix Applied**: Created auth routes in backend (`/api/v1/auth/nonce` and `/api/v1/auth/verify`)

### 3. Port Mismatch
**Problem**: Frontend trying to connect to wrong port
**Fix Applied**: Updated frontend/.env to use correct backend port (3001)

## Environment Configuration

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api/v1
VITE_STUB_MODE=true
VITE_APTOS_NETWORK=testnet
VITE_APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
VITE_APP_NAME=Plexi
VITE_APP_DESCRIPTION=Unified Perp Trading Orchestration on Aptos + Hyperliquid
```

### Backend (.env)
```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-jwt-key-here
```

## API Endpoints

### Health Check
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system info

### Authentication
- `POST /api/v1/auth/nonce` - Request nonce for wallet address
- `POST /api/v1/auth/verify` - Verify signature and get JWT token
- `POST /api/v1/auth/validate` - Validate JWT token

### Vault Operations
- `GET /api/v1/vault` - Get vault information
- `POST /api/v1/vault` - Create vault operations

### Trading & Market Data
- `GET /api/v1/hyperliquid/market` - Get all market data from Hyperliquid
- `GET /api/v1/hyperliquid/market/:symbol` - Get specific market data (e.g., BTC, ETH)
- `GET /api/v1/hyperliquid/positions/:userAddress` - Get user positions from Hyperliquid
- `POST /api/v1/hyperliquid/open` - Open a new position
- `POST /api/v1/hyperliquid/close` - Close an existing position

### CLOB (Central Limit Order Book)
- `GET /api/v1/clob/orderbook/:symbol` - Get orderbook data for symbol
- `POST /api/v1/clob/route-order` - Submit order to CLOB
- `GET /api/v1/clob/orders/:userAddress` - Get user's open orders
- `GET /api/v1/clob/fills/:userAddress` - Get user's recent trades/fills

### Trade Management
- `GET /api/v1/trades` - Get all trades (supports filtering by userAddress, status)
- `GET /api/v1/trades/:tradeId` - Get specific trade by ID
- `POST /api/v1/trades` - Create new trade record
- `PUT /api/v1/trades/:tradeId` - Update trade status

## Debugging Steps

1. **Check backend status**: `curl http://localhost:3001/`
2. **Verify frontend env**: Check if `.env` exists and has correct API URL
3. **Check browser console**: Look for network errors and API call failures
4. **Monitor backend logs**: Check `backend.log` for server errors
5. **Test auth flow**: Use curl commands above to test auth endpoints

## Recent Fixes Applied

 Fixed port mismatch (frontend 4000 � 3001)
 Created missing auth routes in backend
 Added JWT authentication system
 Updated environment configuration

## Latest Implementation Fixes (Sept 2024)

✅ **Fixed price data fetching with CoinGecko integration**
- Removed broken CoinCap fallback API
- Added CryptoCompare as working fallback
- Implemented real-time APT price display in USD

✅ **Implemented missing trading API endpoints**
- Added `/api/v1/hyperliquid/market` for market data
- Added `/api/v1/hyperliquid/positions/:userAddress` for user positions
- Added `/api/v1/clob/orderbook/:symbol` for order book data
- Added `/api/v1/trades` for trade management

✅ **Created shared formatting utilities**
- Centralized formatting functions in `/src/utils/formatters.ts`
- Removed duplicate formatting code from components
- Improved code maintainability

✅ **Dashboard improvements**
- Integrated price service with main dashboard
- Added USD value display for all APT amounts
- Removed excessive debug logging
- Simplified loading state logic

## Dashboard Optimization Checklist

### 🚨 Critical Price Data Fixes

#### Price Service Integration
- [ ] **Fix CoinCap fallback API endpoint** (`src/services/priceService.ts:53`)
  - Current broken endpoint: `https://api.coincap.io/v2/assets/aptos` (404 error)
  - Replace with working endpoint or remove fallback entirely
  - Location: `priceService.ts:53`

- [ ] **Integrate price service with main dashboard stats** (`src/pages/DashboardPage.tsx`)
  - Import `priceService` into DashboardPage component
  - Replace hardcoded mock values with real USD conversions
  - Update stats cards to show USD values instead of APT amounts
  - Location: `DashboardPage.tsx:164-228`

- [ ] **Fix user balance display** (`src/pages/DashboardPage.tsx:142`)
  - Currently shows: `{formatCurrency(user.balance)} APT`
  - Should show: USD value using current APT price
  - Location: `DashboardPage.tsx:142`

- [ ] **Update vault stats to use price service**
  - Ensure `VaultStats.tsx` price data flows to main dashboard
  - Verify price updates are reflected across all components
  - Location: `VaultStats.tsx:37-42`

### 🔧 Code Complexity Optimizations

#### DashboardPage Component Refactoring
- [ ] **Remove excessive debug logging** (`src/pages/DashboardPage.tsx`)
  - Remove console.log statements on lines: 54, 93-102, 106, 121
  - Keep only essential error logging for production
  - Location: Throughout `DashboardPage.tsx`

- [ ] **Simplify loading state logic** (`src/pages/DashboardPage.tsx:105-119`)
  - Remove force timeout mechanism (lines 52-59)
  - Implement unified loading indicator instead of complex nested conditions
  - Fix underlying data loading issues causing timeouts
  - Location: `DashboardPage.tsx:105-119`

- [ ] **Extract formatting utilities** (`src/pages/DashboardPage.tsx:70-90`)
  - Move `formatNumber`, `formatCurrency`, `formatAddress` to `src/utils/formatters.ts`
  - Replace duplicate formatting logic across components
  - Import centralized utilities
  - Location: `DashboardPage.tsx:70-90`

- [ ] **Break down large component**
  - Extract stats cards section to `<DashboardStats />` component
  - Create `<DashboardHeader />` for header section
  - Move trading positions to `<TradingPositions />` component
  - Location: `DashboardPage.tsx:123-301`

#### Mock Data Cleanup
- [ ] **Replace mock wallet functionality** (`src/store/useWalletStore.ts`)
  - Remove mock address generation (line 7)
  - Remove mock signature generation (lines 35-41)
  - Implement real Petra wallet integration
  - Location: `useWalletStore.ts:3-50`

- [ ] **Remove vault mock data** (`src/store/useVaultStore.ts`)
  - Replace hardcoded hedge/farming percentages (lines 68-69)
  - Remove mock claim rewards implementation (lines 144-155)
  - Location: `useVaultStore.ts:68-69, 144-155`

- [ ] **Clean up API service mocks** (`src/services/api.ts`)
  - Review stub mode logic (lines 44-47)
  - Add feature flags for mock vs real data
  - Implement proper error handling instead of mock fallbacks
  - Location: `api.ts:44-86, 166-272`

### 🧹 Code Quality Improvements

#### Comment Cleanup
- [ ] **Remove unnecessary comments** (`src/services/api.ts`)
  - Remove obvious comments like "// Debug logging"
  - Keep only architectural and business logic comments
  - Location: Throughout codebase

- [ ] **Remove development comments**
  - Clean up "Mock data for now" comments
  - Remove temporary debugging comments
  - Location: Multiple files

#### Error Handling
- [ ] **Improve API error handling**
  - Add proper retry mechanisms with exponential backoff
  - Implement API health monitoring
  - Replace console.warn with proper error reporting
  - Location: `api.ts:164-272`

- [ ] **Add price service error boundaries**
  - Handle CoinGecko API rate limiting
  - Implement graceful fallback for price failures
  - Location: `priceService.ts:30-79`

### 📋 Testing Checklist

#### Verification Steps
- [ ] **Test price data display**
  - Verify APT prices show in USD across dashboard
  - Check 24h change indicators work correctly
  - Ensure price updates refresh properly

- [ ] **Test loading states**
  - Verify unified loading indicator works
  - Check no infinite loading scenarios
  - Test error state handling

- [ ] **Test API endpoints**
  - Verify CoinGecko integration works in browser
  - Test fallback scenarios
  - Check CORS policies

### 🚀 Production Readiness

#### Final Steps
- [ ] **Remove all console.log statements**
- [ ] **Add environment-based mock controls**
- [ ] **Implement proper error boundaries**
- [ ] **Add price data caching strategy**
- [ ] **Test with real Petra wallet**

## Notes for Future Development

- In production, implement proper signature verification for wallet authentication
- Replace in-memory nonce store with Redis or database
- Add rate limiting for auth endpoints
- Implement proper error handling for Petra wallet integration
- Consider implementing WebSocket for real-time price updates
- Add comprehensive error monitoring and alerting