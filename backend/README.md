# Plexi Vault Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-green)](https://www.mongodb.com/)

A production-ready Node.js TypeScript backend server for the Plexi Vault Protocol that integrates with Aptos blockchain for APT vault operations, user management, and real-time analytics.

## 🚀 Features

### 💰 Vault Operations
- **APT Deposits/Withdrawals**: Handle APT token deposits and withdrawals with share-based accounting
- **Smart Contract Integration**: Direct interaction with Aptos Move vault contracts
- **Transaction Management**: Complete transaction lifecycle tracking and status updates
- **User Position Tracking**: Real-time user balance and share calculations

### 📊 Analytics & Data
- **TVL Tracking**: Real-time Total Value Locked calculations
- **Event Indexing**: Comprehensive vault event logging and retrieval
- **Performance Metrics**: APY calculations and historical performance data
- **Transaction History**: Detailed transaction logs with pagination

### 🔐 Security & Validation
- **Input Validation**: Zod schema validation for all API inputs
- **Rate Limiting**: Configurable rate limits per endpoint
- **Error Handling**: Comprehensive error handling with structured logging
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for enhanced security

### 🛠️ Infrastructure
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **RESTful API**: Clean, documented API endpoints
- **Health Monitoring**: Application and service health checks
- **Structured Logging**: Winston-based logging with multiple transports
- **Testing Suite**: Comprehensive Jest tests with MongoDB memory server

## 🛠️ Tech Stack

### Core Framework
- **Runtime**: Node.js 18+ with TypeScript
- **Web Framework**: Express.js with middleware
- **Database**: MongoDB 5+ with Mongoose ODM
- **Validation**: Zod for runtime type checking

### Blockchain Integration
- **Aptos SDK**: Official Aptos TypeScript SDK
- **Smart Contracts**: Move language contract interactions
- **Transaction Management**: Aptos transaction lifecycle handling

### Development & Operations
- **Testing**: Jest with Supertest for API testing
- **Logging**: Winston with multiple transports
- **Security**: Helmet.js, CORS, express-rate-limit
- **Development**: ts-node-dev for hot reloading
- **Build**: TypeScript compiler with strict mode

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **MongoDB** 5.0+ (local installation or cloud service)
- **Aptos CLI** (optional, for contract deployment)
- **Git** for version control

### Optional
- **Docker** for containerized deployment
- **MongoDB Compass** for database management
- **Postman** for API testing

## 🔧 Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # Database
   MONGO_URI=mongodb://localhost:27017/plexix
   
   # Aptos Configuration
   APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
   VAULT_MODULE_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
   VAULT_MODULE_NAME=vault_v2
   
   # Security
   JWT_SECRET=your-jwt-secret-here
   ADMIN_PASSWORD=your-admin-password
   
   # Optional
   PRIVATE_KEY=your-private-key-for-admin-operations
   ```

4. **Start MongoDB (if running locally)**
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Linux systemd
   sudo systemctl start mongod
   
   # Manual start
   mongod --dbpath ./data/db
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:watch
```

## 📚 API Endpoints

### Health & Monitoring
- `GET /health` - Basic application health check
- `GET /api/v1/health` - Detailed service health status

### Authentication
- `POST /api/v1/auth/login` - Admin login with password
- `POST /api/v1/auth/logout` - Logout and invalidate session
- `GET /api/v1/auth/me` - Get current user information

### Vault Operations
- `GET /api/v1/vault/state` - Get current vault state (TVL, shares, price)
- `GET /api/v1/vault/user/:address` - Get user position and transaction history
- `GET /api/v1/vault/events` - Get vault events for analytics
- `POST /api/v1/vault/deposit` - Process APT deposit transaction
- `POST /api/v1/vault/withdraw` - Process share withdrawal transaction
- `POST /api/v1/vault/reset-if-zero/:address` - Reset user data if zero balance

### Transaction Management
- `GET /api/v1/vault/transactions` - Get paginated transaction history
- `GET /api/v1/vault/transactions/:txHash` - Get specific transaction details

### Conversion Utilities
- `GET /api/v1/vault/convert/shares?amount=X` - Convert APT amount to shares
- `GET /api/v1/vault/convert/assets?shares=X` - Convert shares to APT amount

## 📖 API Documentation

### Deposit APT
```http
POST /api/v1/vault/deposit
Content-Type: application/json

{
  "walletAddress": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "amount": 10.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xabc123...",
    "sharesMinted": 1050,
    "user": {
      "walletAddress": "0x1234...",
      "shares": 1050
    }
  }
}
```

### Withdraw APT
```http
POST /api/v1/vault/withdraw
Content-Type: application/json

{
  "walletAddress": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "shares": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xdef456...",
    "amountWithdrawn": 5.0,
    "user": {
      "walletAddress": "0x1234...",
      "shares": 550
    }
  }
}
```

### Get User State
```http
GET /api/v1/vault/user/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1234...",
    "shares": 1050,
    "assetsEquivalent": 10.5,
    "sharePrice": 1.0,
    "txHistory": [
      {
        "txHash": "0xabc123...",
        "type": "deposit",
        "amount": 10.5,
        "shares": 1050,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Get Vault State
```http
GET /api/v1/vault/state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAssets": 1250.75,
    "totalShares": 125075,
    "sharePrice": 1.0,
    "assetToken": "APT",
    "isInitialized": true,
    "strategiesCount": 2,
    "rewardTokens": ["APT"],
    "lastRebalanceTimestamp": 1705312200
  }
}
```

## 🗄 Database Models

### User Model
```typescript
interface IUser {
  walletAddress: string;  // Unique Aptos wallet address (lowercase)
  shares: number;         // User's current vault shares
  createdAt: Date;        // Account creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

### Transaction Model
```typescript
interface ITransaction {
  txHash: string;                              // Aptos transaction hash
  walletAddress: string;                       // User's wallet address
  type: 'deposit' | 'withdraw';               // Transaction type
  amount: number;                              // APT amount
  shares: number;                              // Shares minted/burned
  status: 'pending' | 'completed' | 'failed'; // Transaction status
  blockHeight?: number;                        // Aptos block height
  gasUsed?: number;                           // Gas consumed
  createdAt: Date;                            // Transaction timestamp
  updatedAt: Date;                            // Last status update
}
```

## 🔒 Security Features

### Request Security
- **Rate Limiting**: 100 requests per 15 minutes (general), 50 requests per 15 minutes (transactions)
- **Input Validation**: Zod schema validation for all API inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for comprehensive header protection

### Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication for admin endpoints
- **Password Hashing**: Bcrypt for secure password storage
- **Session Management**: Secure session handling with expiration

### Data Protection
- **Input Sanitization**: Prevent injection attacks
- **Error Handling**: Secure error responses without sensitive data exposure
- **Logging**: Structured logging without sensitive information
- **Environment Variables**: Secure configuration management

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Service layer and utility function testing
- **Integration Tests**: Complete API endpoint testing with real database
- **Database Tests**: MongoDB operations and model validation
- **Mock Testing**: Aptos SDK mocking for isolated blockchain testing
- **Error Testing**: Comprehensive error handling validation

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- vault.test.ts

# Run tests matching pattern
npm test -- --grep "deposit"
```

### Test Environment
- **MongoDB Memory Server**: In-memory database for testing
- **Supertest**: HTTP assertion testing
- **Jest**: Test framework with mocking capabilities
- **Test Isolation**: Each test runs with clean database state

## 📝 Logging

### Winston Configuration
- **Console Transport**: Colored, formatted logs for development
- **File Transport**: Persistent logging to `logs/` directory
- **Error Logging**: Separate error log file for critical issues
- **Request Logging**: All HTTP requests with timing and status

### Log Levels
- **Error**: Critical errors and exceptions
- **Warn**: Warning messages and potential issues
- **Info**: General application information
- **Debug**: Detailed debugging information (development only)

### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Deposit completed",
  "meta": {
    "walletAddress": "0x1234...",
    "amount": 10.5,
    "txHash": "0xabc123..."
  }
}
```

## 🚀 Deployment

### Environment Configuration

#### Required Variables
```env
# Server
PORT=4000
NODE_ENV=production

# Database
MONGO_URI=mongodb://username:password@host:port/database

# Aptos Blockchain
APTOS_RPC_URL=https://fullnode.mainnet.aptoslabs.com/v1
VAULT_MODULE_ADDRESS=0x...
VAULT_MODULE_NAME=vault_v2

# Security
JWT_SECRET=your-strong-jwt-secret-32-chars-min
ADMIN_PASSWORD=your-secure-admin-password
```

#### Optional Variables
```env
# Admin Operations
PRIVATE_KEY=your-admin-private-key

# Monitoring
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment

#### Build and Run
```bash
# Build Docker image
docker build -t plexi-vault-backend .

# Run container
docker run -d \
  --name plexi-backend \
  -p 4000:4000 \
  --env-file .env \
  plexi-vault-backend
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/plexix
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🤝 Contributing

### Development Workflow
1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-fork/plexi-aptos.git
   cd plexi-aptos/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run lint
   ```

6. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

7. **Make Changes and Test**
   - Add comprehensive tests for new functionality
   - Follow existing code patterns and conventions
   - Update documentation as needed

8. **Submit Pull Request**
   - Ensure all tests pass
   - Include clear description of changes
   - Reference any related issues

### Code Standards
- **TypeScript**: Strict mode enabled with comprehensive typing
- **ESLint**: Follow configured linting rules
- **Prettier**: Automatic code formatting
- **Testing**: Maintain >80% test coverage
- **Documentation**: JSDoc comments for all public functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for the Aptos ecosystem**

## 🆘 Support & Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   brew services list | grep mongodb  # macOS
   sudo systemctl status mongod       # Linux
   
   # Test connection
   mongosh mongodb://localhost:27017/plexix
   ```

2. **Aptos RPC Connection Issues**
   ```bash
   # Test RPC endpoint
   curl https://fullnode.testnet.aptoslabs.com/v1/
   
   # Check network configuration
   echo $APTOS_RPC_URL
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 4000
   lsof -i :4000
   
   # Kill process
   kill -9 <PID>
   ```

4. **Environment Variables Not Loaded**
   ```bash
   # Verify .env file exists and is readable
   ls -la .env
   
   # Check if variables are loaded
   node -e "console.log(process.env.PORT)"
   ```

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-org/plexi-aptos/issues)
- **Documentation**: [Full project documentation](../README.md)
- **API Testing**: Use the Postman collection in `../docs/postman_collection.json`
- **Logs**: Check application logs in `logs/` directory

### Health Checks
```bash
# Application health
curl http://localhost:4000/health

# Detailed service status
curl http://localhost:4000/api/v1/health

# Database connectivity test
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('DB OK'))"
```
