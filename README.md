# PlexiX Vault Protocol

A production-grade DeFi vault protocol built on Aptos, featuring ERC-4626-like functionality with extensible strategy hooks for Hyperliquid perps and Aptos-native yield farming.

## 🏗️ Architecture

```
plexi/
├── sources/                    # Move smart contracts
│   └── vault.move             # Main vault contract
├── tests/                     # Move unit tests
│   └── vault_tests.move       # Contract test suite
├── backend/                   # TypeScript backend service
│   ├── src/
│   │   ├── api/               # REST API routes & controllers
│   │   ├── services/          # Core business logic
│   │   ├── models/            # MongoDB schemas
│   │   ├── middlewares/       # Express middleware
│   │   └── utils/             # Utility functions
│   └── dist/                  # Compiled JavaScript
├── scripts/                   # Deployment & utility scripts
├── docs/                      # API documentation
└── docker-compose.yml         # Container orchestration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Aptos CLI
- MongoDB (or use Docker)

### 1. Environment Setup

```bash
# Clone and setup
git clone <repository-url>
cd plexi

# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install
```

### 3. Run with Docker (Recommended)

```bash
# Start all services (backend + MongoDB)
npm run docker:run

# Check logs
docker-compose logs -f backend

# Stop services
npm run docker:stop
```

### 4. Run Locally (Development)

```bash
# Start MongoDB (if not using Docker)
mongod --dbpath ./data/db

# Start backend in development mode
npm run dev

# In another terminal, run tests
npm test
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APTOS_RPC_URL` | Aptos network RPC endpoint | `https://fullnode.testnet.aptoslabs.com/v1` |
| `VAULT_MODULE_ADDRESS` | Deployed vault contract address | Required |
| `PRIVATE_KEY` | Admin private key (AIP-80 format) | Required |
| `ADMIN_JWT_SECRET` | JWT signing secret | Required |
| `ADMIN_PASSWORD` | Admin login password | Required |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/plexix` |
| `PORT` | HTTP server port | `4000` |
| `KEEPER_MODE` | Keeper mode (`stub` or `live`) | `stub` |
| `ENABLE_KEEPER` | Enable keeper service | `true` |
| `ENABLE_INDEXER` | Enable event indexer | `true` |

### Vault Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_HEDGE_PERCENT` | Default hedge allocation % | `30` |
| `DEFAULT_FARM_PERCENT` | Default farm allocation % | `70` |
| `REBALANCE_THRESHOLD_PERCENT` | Rebalance trigger threshold | `5` |
| `REBALANCE_COOLDOWN` | Cooldown between rebalances (seconds) | `3600` |

## 📡 API Documentation

### Base URL
- Development: `http://localhost:4000`
- Production: `https://api.plexix.app`

### Authentication

Admin endpoints require JWT authentication:

```bash
# Login to get JWT token
curl -X POST http://localhost:4000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your-admin-password"}'

# Use token in subsequent requests
curl -X GET http://localhost:4000/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Public Endpoints

#### Get Vault State
```http
GET /api/v1/vault/state
```

Response:
```json
{
  "code": "SUCCESS",
  "data": {
    "totalAssets": "1000000",
    "totalShares": "500000",
    "assetToken": "USDC",
    "isInitialized": true,
    "strategiesCount": 2,
    "rewardTokens": ["YIELD"],
    "lastRebalanceTimestamp": 1640995200
  }
}
```

#### Get User Position
```http
GET /api/v1/vault/user/{address}
```

#### Get Vault Events
```http
GET /api/v1/vault/events?limit=50&offset=0&type=DepositEvent
```

#### Convert Assets/Shares
```http
GET /api/v1/vault/convert/shares?amount=1000
GET /api/v1/vault/convert/assets?shares=500
```

### Transaction Endpoints

#### Deposit Assets
```http
POST /api/v1/tx/deposit
Content-Type: application/json

{
  "userAddress": "0x123...",
  "amount": "1000",
  "useServerSigner": false
}
```

#### Withdraw Assets
```http
POST /api/v1/tx/withdraw
Content-Type: application/json

{
  "userAddress": "0x123...",
  "amount": "500",
  "useServerSigner": false
}
```

#### Mint Shares
```http
POST /api/v1/tx/mint
Content-Type: application/json

{
  "shares": "1000",
  "receiver": "0x123...",
  "useServerSigner": false
}
```

#### Redeem Shares
```http
POST /api/v1/tx/redeem
Content-Type: application/json

{
  "shares": "500",
  "receiver": "0x123...",
  "owner": "0x123...",
  "useServerSigner": false
}
```

### Admin Endpoints (Requires Authentication)

#### Rebalance Vault
```http
POST /api/v1/admin/rebalance
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "hedgePercent": 40,
  "farmPercent": 60
}
```

#### Register Strategy
```http
POST /api/v1/admin/register-strategy
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "name": "Hyperliquid BTC Perps",
  "riskLevel": 3,
  "metadata": {}
}
```

#### Harvest Yield
```http
POST /api/v1/admin/harvest
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "strategyId": 1
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests (Aptos Testnet)
```bash
# Run integration tests against deployed contract
npm run test:integration
```

### API Tests
```bash
# Test API endpoints with Supertest
npm test -- --testPathPattern=api.test.ts
```

## 🔄 Services

### Event Indexer
Automatically syncs on-chain events to MongoDB:
- Polls vault contract for events every 10 seconds
- Indexes deposits, withdrawals, rebalances, harvests
- Updates transaction statuses
- Creates periodic vault snapshots

### Keeper Service
Automated vault management:
- **Stub Mode**: Logs actions without executing (safe for testing)
- **Live Mode**: Executes real transactions
- Auto-rebalancing based on thresholds
- Yield harvesting opportunities
- Vault health monitoring

### Rate Limiting
- General API: 100 requests per 15 minutes
- Transaction endpoints: 50 requests per 15 minutes
- Admin endpoints: Protected by JWT authentication

## 🐳 Docker Deployment

### Development
```bash
# Start with hot reload
docker-compose up --build

# View logs
docker-compose logs -f backend
```

### Production
```bash
# Build production image
docker build -t plexix-backend .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d

# Enable Nginx proxy
docker-compose --profile production up -d
```

### Environment Variables in Docker
```bash
# Create .env file with production values
cp env.example .env

# Start services
docker-compose up -d
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Application health
curl http://localhost:4000/health

# Service status
curl http://localhost:4000/api/v1/admin/health \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Logs
```bash
# Application logs
docker-compose logs -f backend

# MongoDB logs
docker-compose logs -f mongo

# Nginx logs (if using proxy)
docker-compose logs -f nginx
```

### Metrics
- Transaction success/failure rates
- API response times
- Keeper action frequency
- Vault TVL and share price

## 🔒 Security

### Best Practices
- JWT tokens expire in 24 hours
- Rate limiting on all endpoints
- Input validation with Zod schemas
- Helmet.js security headers
- MongoDB injection prevention
- Private key stored securely

### Admin Access
- Change default admin password
- Use strong JWT secrets (32+ characters)
- Rotate keys regularly in production
- Consider multi-sig for admin operations

## 🚀 Deployment Guide

### 1. Prepare Environment
```bash
# Create production server
# Install Docker, Docker Compose, Node.js

# Clone repository
git clone <repo-url>
cd plexi
```

### 2. Configure Environment
```bash
# Copy and edit environment
cp env.example .env
nano .env

# Set production values:
# - Strong JWT secret
# - Production MongoDB URI
# - Real private keys
# - Domain names for CORS
```

### 3. Deploy Services
```bash
# Build and start
docker-compose up -d --build

# Verify services
docker-compose ps
curl http://localhost:4000/health
```

### 4. Setup Nginx (Optional)
```bash
# Enable Nginx proxy
docker-compose --profile production up -d

# Configure SSL certificates
# Update nginx/nginx.conf with your domain
```

### 5. Monitor Deployment
```bash
# Check logs
docker-compose logs -f

# Monitor resources
docker stats

# Test API endpoints
curl http://your-domain.com/api/v1/vault/state
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting: `npm run lint`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: `/docs/`
- Issues: GitHub Issues
- API Collection: `docs/postman_collection.json`

---

**PlexiX Team** - Building the future of DeFi on Aptos
