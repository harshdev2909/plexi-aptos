import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// Mock trade data for development
const generateMockTrades = (userAddress?: string, limit: number = 50) => {
  const trades = [];
  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'APT-USD'];
  const directions = ['LONG', 'SHORT'] as const;
  const statuses = ['pending', 'opened', 'closed', 'cancelled'] as const;

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const size = (Math.random() * 10 + 1).toFixed(4);
    const leverage = Math.floor(Math.random() * 10) + 1;
    const entryPrice = (Math.random() * 50000 + 1000).toFixed(2);

    trades.push({
      id: `trade_${Date.now()}_${i}`,
      strategyId: Math.floor(Math.random() * 5) + 1,
      positionId: status !== 'pending' ? `pos_${Date.now()}_${i}` : undefined,
      symbol,
      size,
      direction,
      leverage,
      entryPrice: status !== 'pending' ? entryPrice : undefined,
      liquidationPrice: status === 'opened' ? (parseFloat(entryPrice) * 0.9).toFixed(2) : undefined,
      pnl: status === 'closed' ? ((Math.random() - 0.5) * 1000).toFixed(2) : undefined,
      status,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      userAddress: userAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
      vaultAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      metadata: {
        createdBy: 'automated_strategy',
        strategyName: `Strategy ${Math.floor(Math.random() * 5) + 1}`,
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
    });
  }

  return trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// GET /api/v1/trades - Get all trades or filter by user
router.get('/', async (req, res) => {
  try {
    const { userAddress, limit = '50', offset = '0', status } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Generate mock trades
    let trades = generateMockTrades(userAddress as string, limitNum + offsetNum);

    // Filter by status if provided
    if (status) {
      trades = trades.filter(trade => trade.status === status);
    }

    // Apply pagination
    const paginatedTrades = trades.slice(offsetNum, offsetNum + limitNum);

    logger.info('Fetched trades:', {
      userAddress,
      total: trades.length,
      returned: paginatedTrades.length,
      limit: limitNum,
      offset: offsetNum,
    });

    res.json({
      success: true,
      data: paginatedTrades,
      pagination: {
        total: trades.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < trades.length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch trades:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch trades',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/trades/:tradeId - Get specific trade by ID
router.get('/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;

    // In a real implementation, this would fetch from database
    // For now, generate a mock trade with the requested ID
    const mockTrade = {
      id: tradeId,
      strategyId: 1,
      positionId: `pos_${Date.now()}`,
      symbol: 'BTC-USD',
      size: '1.5000',
      direction: 'LONG' as const,
      leverage: 5,
      entryPrice: '45000.00',
      liquidationPrice: '40500.00',
      pnl: '150.00',
      status: 'opened' as const,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      userAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      vaultAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      metadata: {
        createdBy: 'automated_strategy',
        strategyName: 'Strategy 1',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockTrade,
    });
  } catch (error: any) {
    logger.error('Failed to fetch trade:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch trade',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/trades - Create a new trade (typically called internally)
router.post('/', async (req, res) => {
  try {
    const {
      strategyId,
      symbol,
      size,
      direction,
      leverage,
      userAddress,
      vaultAddress,
      metadata = {},
    } = req.body;

    // Validate required fields
    const requiredFields = ['strategyId', 'symbol', 'size', 'direction', 'leverage', 'userAddress', 'vaultAddress'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Missing required fields: ${missingFields.join(', ')}`,
          statusCode: 400,
        },
      });
    }

    // Validate direction
    if (!['LONG', 'SHORT'].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid direction. Must be LONG or SHORT',
          statusCode: 400,
        },
      });
    }

    // Create new trade
    const newTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
      strategyId,
      symbol,
      size,
      direction,
      leverage,
      status: 'pending' as const,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      userAddress,
      vaultAddress,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Trade created:', newTrade);

    res.status(201).json({
      success: true,
      data: newTrade,
      message: 'Trade created successfully',
    });
  } catch (error: any) {
    logger.error('Failed to create trade:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create trade',
        statusCode: 500,
      },
    });
  }
});

// PUT /api/v1/trades/:tradeId - Update trade status
router.put('/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status, entryPrice, liquidationPrice, pnl, positionId } = req.body;

    // Validate status
    if (status && !['pending', 'opened', 'closed', 'cancelled', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid status',
          statusCode: 400,
        },
      });
    }

    // In a real implementation, this would update in database
    const updatedTrade = {
      id: tradeId,
      status,
      entryPrice,
      liquidationPrice,
      pnl,
      positionId,
      updatedAt: new Date().toISOString(),
    };

    logger.info('Trade updated:', updatedTrade);

    res.json({
      success: true,
      data: updatedTrade,
      message: 'Trade updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update trade:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update trade',
        statusCode: 500,
      },
    });
  }
});

export default router;