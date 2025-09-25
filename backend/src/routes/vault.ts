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
    
    // Calculate shares: 1 APT = 100 shares (matching frontend calculation)
    const sharesMinted = amount * 100;
    
    // Record deposit with Hyperliquid integration
    const depositResult = await vaultService.recordDeposit(walletAddress, amount, mockTxHash);

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
    if (depositResult.hyperliquidSuccess) {
      logger.info(`Hyperliquid position opened: Order ID ${depositResult.hyperliquidOrderId}`);
    }

    res.status(201).json({
      success: true,
      data: {
        txHash: depositResult.txHash,
        sharesMinted: depositResult.sharesMinted,
        hyperliquidOrderId: depositResult.hyperliquidOrderId,
        hyperliquidSuccess: depositResult.hyperliquidSuccess,
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
    // Calculate user shares from transactions instead of User model
    const deposits = await Transaction.find({
      walletAddress: address,
      type: 'deposit',
      status: 'completed'
    });
    const withdrawals = await Transaction.find({
      walletAddress: address,
      type: 'withdraw',
      status: 'completed'
    });

    const totalDepositsShares = deposits.reduce((sum, tx) => sum + tx.shares, 0);
    const totalWithdrawalsShares = withdrawals.reduce((sum, tx) => sum + tx.shares, 0);
    const userShares = Math.max(totalDepositsShares - totalWithdrawalsShares, 0);

    // Get vault state to calculate assets equivalent
    const vaultState = await vaultService.getVaultState();
    const assetsEquivalent = userShares * vaultState.sharePrice;

    // Get user's transaction history
    const transactions = await Transaction.find({ walletAddress: address })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        walletAddress: address,
        shares: userShares,
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

/**
 * GET /vault/events
 * Get vault events (for dashboard data fetching)
 */
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '50' } = req.query;
  const limitNum = Math.min(parseInt(limit as string) || 50, 100);

  try {
    // Get recent transactions as "events"
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('-__v');

    // Transform transactions to event format expected by frontend
    const events = transactions.map(tx => ({
      id: (tx._id as any).toString(),
      eventType: tx.type === 'deposit' ? 'DepositEvent' : 'WithdrawEvent',
      txHash: tx.txHash,
      payload: {
        amount: tx.amount.toString(),
        user: tx.walletAddress,
        shares: tx.shares?.toString() || '0'
      },
      createdAt: tx.createdAt.toISOString()
    }));

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get vault events error:', error);
    throw error;
  }
}));


/**
 * POST /vault/reset-if-zero/:address
 * Check contract vault value for user address and reset database if zero
 */
router.post('/reset-if-zero/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    // First, check the contract vault value for this address
    const userShares = await vaultService.getUserShares(address);

    logger.info(`Contract check for ${address}: ${userShares} shares`);

    // If shares are effectively zero (less than 0.001), reset the database
    if (userShares < 0.001) {
      logger.info(`User ${address} has effectively zero shares (${userShares}), resetting database...`);

      // Delete all transactions for this user
      const deletedTransactions = await Transaction.deleteMany({ walletAddress: address });

      // Delete or reset the user record
      await User.findOneAndDelete({ walletAddress: address });

      logger.info(`Reset complete for ${address}: deleted ${deletedTransactions.deletedCount} transactions and user record`);

      res.status(200).json({
        success: true,
        message: `Database reset completed for ${address}`,
        data: {
          contractShares: userShares,
          deletedTransactions: deletedTransactions.deletedCount,
          action: 'reset'
        }
      });
    } else {
      logger.info(`User ${address} has ${userShares} shares, no reset needed`);

      res.status(200).json({
        success: true,
        message: `No reset needed for ${address}`,
        data: {
          contractShares: userShares,
          action: 'no_reset'
        }
      });
    }
  } catch (error) {
    logger.error('Reset-if-zero error:', error);
    throw error;
  }
}));

/**
 * GET /vault/hyperliquid/positions/:address
 * Get Hyperliquid position status for a user
 */
router.get('/hyperliquid/positions/:address', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;

  try {
    const positionStatus = await vaultService.getHyperliquidPositionStatus(address);
    
    res.status(200).json({
      success: true,
      data: positionStatus
    });
  } catch (error) {
    logger.error('Get Hyperliquid position status error:', error);
    throw error;
  }
}));

/**
 * GET /vault/hyperliquid/verify/:orderId
 * Verify a Hyperliquid order on-chain
 */
router.get('/hyperliquid/verify/:orderId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const { coin = 'APT' } = req.query;

  try {
    const verification = await vaultService.verifyHyperliquidOrder(parseInt(orderId), coin as string);
    
    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    logger.error('Verify Hyperliquid order error:', error);
    throw error;
  }
}));

export default router;
