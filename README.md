# Plexi Vault Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Aptos](https://img.shields.io/badge/Aptos-Testnet-blue)](https://aptos.dev/)

A DeFi vault protocol built on Aptos blockchain that combines perpetual trading and yield farming strategies with dynamic hedging. Earn optimized returns while managing risk through automated asset allocation and real-time portfolio management.

## 🌟 Features

### 🏦 Vault Management
- **APT Deposits & Withdrawals**: Seamless APT token deposits with share-based accounting
- **MST Share Tokens**: Receive MST (vault share) tokens representing your position
- **Real-Time TVL**: Live tracking of Total Value Locked in the vault
- **7% Fixed APY**: Consistent returns on your deposited APT

### 📊 Analytics & Insights
- **Portfolio Dashboard**: Track your position, earnings, and transaction history
- **TVL Growth Charts**: Visualize vault performance over time
- **Transaction History**: Complete audit trail of all vault operations
- **Strategy Metrics**: Monitor hedge ratios and asset deployment

### 🔗 Aptos Integration
- **Native APT Support**: Built specifically for Aptos ecosystem
- **Petra Wallet**: Seamless integration with Petra wallet
- **Smart Contracts**: Secure Move-based vault contracts
- **Testnet Ready**: Fully functional on Aptos Testnet

### 🎨 User Experience
- **Modern Interface**: Clean, responsive React-based dashboard
- **Real-Time Updates**: Automatic data refresh after transactions
- **Mobile Friendly**: Optimized for all device sizes
- **Intuitive Design**: Easy-to-use deposit and withdrawal flows

## 📚 What is Plexi Vault?

Plexi Vault is a **composable DeFi vault** that automatically manages your APT tokens across multiple yield-generating strategies:

### 🎢 How It Works
1. **Deposit APT**: Users deposit APT tokens into the vault
2. **Receive MST Shares**: Get MST tokens representing your vault position
3. **Automated Strategies**: Vault deploys assets across perpetual trading and yield farming
4. **Earn Returns**: Benefit from 7% APY through optimized strategy allocation
5. **Withdraw Anytime**: Redeem MST tokens for APT plus earned yields

### 📊 Strategy Composition
- **100% Asset Deployment**: All deposited APT is actively deployed
- **Dynamic Hedging**: Risk management through perpetual futures positions
- **Yield Farming**: Earn rewards from Aptos DeFi protocols
- **Automated Rebalancing**: Maintains optimal risk/return profile

## 📋 Table of Contents

- [What is Plexi Vault?](#-what-is-plexi-vault)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🏗️ Architecture

```
plexi-aptos/
├── sources/                    # Move smart contracts
│   └── vault.move             # Main vault contract
├── vault_v2/                  # Latest contract version
│   ├── sources/               # Contract source files
│   └── Move.toml              # Move package configuration
├── frontend/                  # React web application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API and external services
│   │   ├── contexts/          # React contexts
│   │   └── store/             # State management
│   ├── public/                # Static assets
│   └── dist/                  # Built application
├── backend/                   # Node.js/Express API server
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic services
│   │   ├── models/            # Database models
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utility functions
│   └── dist/                  # Compiled JavaScript
├── tests/                     # Test suites
│   ├── integration/           # Integration tests
│   └── vault_tests.move       # Move contract tests
├── scripts/                   # Deployment & utility scripts
├── docs/                      # Documentation
├── nginx/                     # Nginx configuration
└── docker-compose.yml         # Container orchestration
```

## 🚀 Quick Start

### For Users
1. **Get Test APT**: Visit [Aptos Testnet Faucet](https://aptoslabs.com/testnet-faucet) to get test APT tokens
2. **Install Petra Wallet**: Download from [Petra Wallet](https://petra.app/)
3. **Visit Plexi Vault**: Go to the application URL
4. **Connect Wallet**: Click "Connect Wallet" and approve the connection
5. **Deposit APT**: Enter amount and confirm transaction
6. **Earn Yields**: Watch your MST shares grow with 7% APY

### For Developers

#### Prerequisites
- **Node.js** 18.0.0+
- **Docker** and **Docker Compose**
- **MongoDB** 5.0+

#### Setup
```bash
# Clone and setup
git clone https://github.com/your-org/plexi-aptos.git
cd plexi-aptos

# Start with Docker (recommended)
docker-compose up -d

# Or install dependencies manually
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 🛠️ Development Setup

### Local Development (Without Docker)

```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/db

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev

# Terminal 4: Run tests (optional)
npm test
```

### Environment Variables

Create `.env` files in the root, frontend, and backend directories:

#### Root `.env`
```env
# Aptos Configuration
APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
VAULT_MODULE_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
PRIVATE_KEY=your-private-key-here

# Database
MONGO_URI=mongodb://localhost:27017/plexix

# Security
ADMIN_JWT_SECRET=your-jwt-secret-here
ADMIN_PASSWORD=your-admin-password
```

#### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APTOS_NETWORK=testnet
VITE_VAULT_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
```

#### Backend `.env`
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/plexix
APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
VAULT_MODULE_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
JWT_SECRET=your-jwt-secret
```

### Smart Contract Deployment

```bash
# Compile contracts
aptos move compile --package-dir vault_v2

# Deploy to testnet
aptos move publish --package-dir vault_v2 --named-addresses vault_addr=your-address

# Initialize vault (after deployment)
aptos move run --function-id 'your-address::vault_v2::initialize' --args address:your-address
```

## 📡 API Documentation

### Base URLs
- **Development**: `http://localhost:4000/api/v1`
- **Production**: `https://api.plexi.app/api/v1`

### Authentication

Most endpoints are public. Admin endpoints require JWT authentication.

### Core Endpoints

#### Vault State
```http
GET /vault/state
```
Returns current vault metrics including TVL, total shares, and share price.

#### User Position
```http
GET /vault/user/{address}
```
Returns user's vault position and transaction history.

#### Vault Events
```http
GET /vault/events?limit=50
```
Returns recent vault events for charts and activity feeds.

#### Transactions
```http
POST /vault/deposit
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "amount": 100
}
```

```http
POST /vault/withdraw
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "shares": 50
}
```

For complete API documentation, see the [Postman Collection](docs/postman_collection.json).

## 🔧 Configuration

### Key Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APTOS_RPC_URL` | Aptos network endpoint | `https://fullnode.testnet.aptoslabs.com/v1` |
| `VAULT_MODULE_ADDRESS` | Vault contract address | `0x98dfcb742ea92c051...` |
| `MONGO_URI` | Database connection | `mongodb://localhost:27017/plexix` |
| `PORT` | Server port | `4000` |

For complete configuration details, see [Backend README](backend/README.md).

## 🤝 Contributing

We welcome contributions to Plexi Vault! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Submit a pull request**

### Development Guidelines
- Follow existing code style and conventions
- Add JSDoc comments for all functions
- Include tests for new functionality
- Update documentation as needed


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Resources

### Documentation
- **Frontend Guide**: [Frontend README](frontend/README.md)
- **Backend Guide**: [Backend README](backend/README.md)
- **API Collection**: [Postman Collection](docs/postman_collection.json)

### Aptos Resources
- **Aptos Testnet Faucet**: [Get Test APT](https://aptoslabs.com/testnet-faucet)
- **Petra Wallet**: [Download Wallet](https://petra.app/)
- **Aptos Explorer**: [View Transactions](https://explorer.aptoslabs.com/?network=testnet)
- **Aptos Documentation**: [aptos.dev](https://aptos.dev/)

---

**Built with ❤️ for the Aptos ecosystem**
