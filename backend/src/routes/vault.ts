import { Router, Request, Response } from 'express';
import { VaultService } from '../services/vault-service';
import { User, IUser } from '../models/User';
import { Transaction, ITransaction } from '../models/Transaction';
import { depositRequestSchema, withdrawRequestSchema, queryParamsSchema } from '../utils/validation';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();
const vaultService = new VaultService();

/**
 * POST /vault/deposit
 * Deposit USDC into the vault
 */
router.post('/deposit', validateBody(depositRequestSchema), asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, amount } = req.body;

  try {
    // For now, we'll simulate the deposit since the frontend handles the actual transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64).padEnd(64, '0')}`;
    const depositResult = {
      txHash: mockTxHash,
      sharesMinted: amount,
      success: true
    };

    // Find or create user
    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = new User({ walletAddress, shares: 0 });
    }

    // Update user shares
    user.shares += depositResult.sharesMinted;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      txHash: depositResult.txHash,
      walletAddress,
      type: 'deposit',
      amount,
      shares: depositResult.sharesMinted,
      status: 'completed'
    });
    await transaction.save();

    logger.info(`Deposit completed: ${walletAddress} deposited ${amount} USDC, received ${depositResult.sharesMinted} shares`);

    res.status(201).json({
      success: true,
      data: {
        txHash: depositResult.txHash,
        sharesMinted: depositResult.sharesMinted,
        user: {
          walletAddress: user.walletAddress,
          shares: user.shares
        }
      }
    });
  } catch (error) {
    logger.error('Deposit error:', error);
    throw error;
  }
}));

/**
 * POST /vault/withdraw
 * Withdraw USDC from the vault
 */
router.post('/withdraw', validateBody(withdrawRequestSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { walletAddress, shares } = req.body;

  try {
    // Check if user has enough shares
    const user = await User.findOne({ walletAddress });
    if (!user || user.shares < shares) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Insufficient shares for withdrawal',
          statusCode: 400
        }
      });
      return;
    }

    // For now, we'll simulate the withdrawal since the frontend handles the actual transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64).padEnd(64, '0')}`;
    const withdrawResult = {
      txHash: mockTxHash,
      amountWithdrawn: shares,
      success: true
    };

    // Update user shares
    user.shares -= shares;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      txHash: withdrawResult.txHash,
      walletAddress,
      type: 'withdraw',
      amount: withdrawResult.amountWithdrawn,
      shares,
      status: 'completed'
    });
    await transaction.save();

    logger.info(`Withdrawal completed: ${walletAddress} withdrew ${shares} shares, received ${withdrawResult.amountWithdrawn} USDC`);

    res.status(200).json({
      success: true,
      data: {
        txHash: withdrawResult.txHash,
        amountWithdrawn: withdrawResult.amountWithdrawn,
        user: {
          walletAddress: user.walletAddress,
          shares: user.shares
        }
      }
    });
  } catch (error) {
    logger.error('Withdrawal error:', error);
    throw error;
  }
}));

/**
 * GET /vault/user/:address
 * Get user's vault state
 */
router.get('/user/:address', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;

  try {
    // Find user
    const user = await User.findOne({ walletAddress: address });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 404
        }
      });
      return;
    }

    // Get vault state to calculate assets equivalent
    const vaultState = await vaultService.getVaultState();
    const assetsEquivalent = user.shares * vaultState.sharePrice;

    // Get user's transaction history
    const transactions = await Transaction.find({ walletAddress: address })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        shares: user.shares,
        assetsEquivalent,
        sharePrice: vaultState.sharePrice,
        txHistory: transactions
      }
    });
  } catch (error) {
    logger.error('Get user state error:', error);
    throw error;
  }
}));

/**
 * GET /vault/state
 * Get vault state
 */
router.get('/state', asyncHandler(async (req: Request, res: Response) => {
  try {
    const vaultState = await vaultService.getVaultState();

    res.status(200).json({
      success: true,
      data: vaultState
    });
  } catch (error) {
    logger.error('Get vault state error:', error);
    throw error;
  }
}));

/**
 * GET /vault/transactions
 * Get transaction history with pagination and filters
 */
router.get('/transactions', validateQuery(queryParamsSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, type } = req.query;

  try {
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      Transaction.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    throw error;
  }
}));

/**
 * GET /vault/transactions/:txHash
 * Get specific transaction details
 */
router.get('/transactions/:txHash', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { txHash } = req.params;

  try {
    const transaction = await Transaction.findOne({ txHash });
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Transaction not found',
          statusCode: 404
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    throw error;
  }
}));

export default router;
