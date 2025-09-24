# Plexi Vault Backend API

A Node.js TypeScript backend server for the Plexi Vault MVP that integrates with Aptos blockchain for USDC vault operations.

## 🚀 Features

- **USDC Vault Operations**: Deposit and withdraw USDC with automatic share minting/burning
- **Aptos Integration**: Direct interaction with Aptos smart contracts
- **MongoDB Storage**: Persistent storage for users and transactions
- **REST API**: Clean RESTful endpoints for frontend integration
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error handling and logging
- **Testing**: Jest test suite with MongoDB memory server
- **Security**: Rate limiting, CORS, and input sanitization

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Aptos SDK
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB (local or cloud)
- Aptos Testnet access

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
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://harshdev2909_db_user:harsh9560@cluster0.cjhkeus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
   VAULT_MODULE_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
   VAULT_MODULE_NAME=vault
   ```

4. **Create logs directory**
   ```bash
   mkdir -p logs
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

### Health Check
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check with service dependencies

### Vault Operations
- `POST /api/v1/vault/deposit` - Deposit USDC into vault
- `POST /api/v1/vault/withdraw` - Withdraw USDC from vault
- `GET /api/v1/vault/user/:address` - Get user's vault state
- `GET /api/v1/vault/state` - Get overall vault state
- `GET /api/v1/vault/transactions` - Get transaction history
- `GET /api/v1/vault/transactions/:txHash` - Get specific transaction

## 📖 API Documentation

### Deposit USDC
```http
POST /api/v1/vault/deposit
Content-Type: application/json

{
  "walletAddress": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "sharesMinted": 100,
    "user": {
      "walletAddress": "0x...",
      "shares": 100
    }
  }
}
```

### Withdraw USDC
```http
POST /api/v1/vault/withdraw
Content-Type: application/json

{
  "walletAddress": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "shares": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "amountWithdrawn": 50,
    "user": {
      "walletAddress": "0x...",
      "shares": 50
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
    "walletAddress": "0x...",
    "shares": 100,
    "assetsEquivalent": 100,
    "sharePrice": 1.0,
    "txHistory": [...]
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
    "totalAssets": 10000,
    "totalShares": 10000,
    "sharePrice": 1.0
  }
}
```

## 🗄 Database Models

### User Model
```typescript
{
  walletAddress: string;  // Unique Aptos wallet address
  shares: number;         // User's vault shares
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction Model
```typescript
{
  txHash: string;         // Aptos transaction hash
  walletAddress: string;  // User's wallet address
  type: 'deposit' | 'withdraw';
  amount: number;          // USDC amount
  shares: number;         // Shares involved
  status: 'pending' | 'completed' | 'failed';
  blockHeight?: number;
  gasUsed?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation for all inputs
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers
- **Error Handling**: Secure error responses without sensitive data exposure

## 🧪 Testing

The project includes comprehensive tests:

- **Unit Tests**: Service layer testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB operations testing
- **Mocking**: Aptos SDK mocking for isolated testing

Run tests:
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
```

## 📝 Logging

The application uses Winston for structured logging:

- **Console Output**: Colored console logs in development
- **File Logging**: Separate error and combined logs
- **Structured Logs**: JSON format for production
- **Request Logging**: All API requests are logged

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:

```env
PORT=3001
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
VAULT_MODULE_ADDRESS=your-contract-address
VAULT_MODULE_NAME=vault
```

### Production Build
```bash
npm run build
npm start
```

### Docker Support
```bash
docker build -t plexi-backend .
docker run -p 3001:3001 plexi-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the logs in the `logs/` directory
- Verify environment variables are correctly set
- Ensure MongoDB connection is working
- Check Aptos network connectivity
