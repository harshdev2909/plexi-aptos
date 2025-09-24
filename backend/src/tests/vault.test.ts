import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';
import vaultRoutes from '../routes/vault';
import healthRoutes from '../routes/health';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

// Create test app without database connection
const createTestApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 900000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/vault', vaultRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Plexi Vault Backend API',
      version: '1.0.0'
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

const app = createTestApp();

describe('Vault API Endpoints', () => {
  const testWalletAddress = '0xd2201fd19cfba1eda48016eea501816328cb0a973917689e37aaf2c29d1cc465';
  const testAmount = 100;
  const testShares = 50;

  describe('POST /api/v1/vault/deposit', () => {
    it('should deposit USDC and mint shares successfully', async () => {
      const response = await request(app)
        .post('/api/v1/vault/deposit')
        .send({
          walletAddress: testWalletAddress,
          amount: testAmount
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('txHash');
      expect(response.body.data).toHaveProperty('sharesMinted');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.walletAddress).toBe(testWalletAddress);
      expect(response.body.data.user.shares).toBe(testAmount);

      // Verify user was created in database
      const user = await User.findOne({ walletAddress: testWalletAddress });
      expect(user).toBeTruthy();
      expect(user?.shares).toBe(testAmount);

      // Verify transaction was recorded
      const transaction = await Transaction.findOne({ walletAddress: testWalletAddress });
      expect(transaction).toBeTruthy();
      expect(transaction?.type).toBe('deposit');
      expect(transaction?.amount).toBe(testAmount);
      expect(transaction?.shares).toBe(testAmount);
    });

    it('should return 400 for invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/vault/deposit')
        .send({
          walletAddress: 'invalid-address',
          amount: testAmount
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid Aptos wallet address format');
    });

    it('should return 400 for negative amount', async () => {
      const response = await request(app)
        .post('/api/v1/vault/deposit')
        .send({
          walletAddress: testWalletAddress,
          amount: -100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Amount must be positive');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/vault/deposit')
        .send({
          walletAddress: testWalletAddress
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/vault/withdraw', () => {
    beforeEach(async () => {
      // Create a user with shares for withdrawal tests
      await User.create({
        walletAddress: testWalletAddress,
        shares: testShares
      });
    });

    it('should withdraw shares and burn them successfully', async () => {
      const response = await request(app)
        .post('/api/v1/vault/withdraw')
        .send({
          walletAddress: testWalletAddress,
          shares: 25
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('txHash');
      expect(response.body.data).toHaveProperty('amountWithdrawn');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.shares).toBe(25); // 50 - 25 = 25

      // Verify transaction was recorded
      const transaction = await Transaction.findOne({ 
        walletAddress: testWalletAddress,
        type: 'withdraw'
      });
      expect(transaction).toBeTruthy();
      expect(transaction?.shares).toBe(25);
    });

    it('should return 400 for insufficient shares', async () => {
      const response = await request(app)
        .post('/api/v1/vault/withdraw')
        .send({
          walletAddress: testWalletAddress,
          shares: 100 // More than available
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Insufficient shares for withdrawal');
    });

    it('should return 400 for negative shares', async () => {
      const response = await request(app)
        .post('/api/v1/vault/withdraw')
        .send({
          walletAddress: testWalletAddress,
          shares: -10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Shares must be non-negative');
    });
  });

  describe('GET /api/v1/vault/user/:address', () => {
    beforeEach(async () => {
      // Create a user with shares
      await User.create({
        walletAddress: testWalletAddress,
        shares: testShares
      });

      // Create some transactions
      await Transaction.create([
        {
          txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          walletAddress: testWalletAddress,
          type: 'deposit',
          amount: 100,
          shares: 100,
          status: 'completed'
        },
        {
          txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          walletAddress: testWalletAddress,
          type: 'withdraw',
          amount: 50,
          shares: 50,
          status: 'completed'
        }
      ]);
    });

    it('should return user vault state successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/vault/user/${testWalletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('walletAddress');
      expect(response.body.data).toHaveProperty('shares');
      expect(response.body.data).toHaveProperty('assetsEquivalent');
      expect(response.body.data).toHaveProperty('sharePrice');
      expect(response.body.data).toHaveProperty('txHistory');
      expect(response.body.data.walletAddress).toBe(testWalletAddress);
      expect(response.body.data.shares).toBe(testShares);
      expect(Array.isArray(response.body.data.txHistory)).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentAddress = '0x9999999999999999999999999999999999999999999999999999999999999999';
      
      const response = await request(app)
        .get(`/api/v1/vault/user/${nonExistentAddress}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });

  describe('GET /api/v1/vault/state', () => {
    it('should return vault state successfully', async () => {
      const response = await request(app)
        .get('/api/v1/vault/state')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAssets');
      expect(response.body.data).toHaveProperty('totalShares');
      expect(response.body.data).toHaveProperty('sharePrice');
      expect(typeof response.body.data.totalAssets).toBe('number');
      expect(typeof response.body.data.totalShares).toBe('number');
      expect(typeof response.body.data.sharePrice).toBe('number');
    });
  });

  describe('GET /api/v1/vault/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      await Transaction.create([
        {
          txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          walletAddress: testWalletAddress,
          type: 'deposit',
          amount: 100,
          shares: 100,
          status: 'completed'
        },
        {
          txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          walletAddress: testWalletAddress,
          type: 'withdraw',
          amount: 50,
          shares: 50,
          status: 'completed'
        },
        {
          txHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          walletAddress: testWalletAddress,
          type: 'deposit',
          amount: 200,
          shares: 200,
          status: 'pending'
        }
      ]);
    });

    it('should return transactions with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/vault/transactions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/api/v1/vault/transactions?status=completed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.length).toBe(2);
      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.status).toBe('completed');
      });
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/v1/vault/transactions?type=deposit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.length).toBe(2);
      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.type).toBe('deposit');
      });
    });
  });

  describe('GET /api/v1/vault/transactions/:txHash', () => {
    const testTxHash = '0x1111111111111111111111111111111111111111111111111111111111111111';

    beforeEach(async () => {
      await Transaction.create({
        txHash: testTxHash,
        walletAddress: testWalletAddress,
        type: 'deposit',
        amount: 100,
        shares: 100,
        status: 'completed'
      });
    });

    it('should return specific transaction', async () => {
      const response = await request(app)
        .get(`/api/v1/vault/transactions/${testTxHash}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.txHash).toBe(testTxHash);
      expect(response.body.data.walletAddress).toBe(testWalletAddress);
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentTxHash = '0x9999999999999999999999999999999999999999999999999999999999999999';
      
      const response = await request(app)
        .get(`/api/v1/vault/transactions/${nonExistentTxHash}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Transaction not found');
    });
  });
});
