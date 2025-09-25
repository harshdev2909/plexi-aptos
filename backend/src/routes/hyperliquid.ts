import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = express.Router();

// Hyperliquid API configuration
const HYPERLIQUID_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.hyperliquid.xyz'
  : 'https://api.hyperliquid-testnet.xyz';

// Helper function to make requests to Hyperliquid API
const hyperliquidRequest = async (requestData: any) => {
  try {
    const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    logger.error('Hyperliquid API request failed:', error);
    throw new Error(`Hyperliquid API error: ${error.message}`);
  }
};

// GET /api/v1/hyperliquid/market - Get all market data
router.get('/market', async (req, res) => {
  try {
    // Get all mid prices
    const midPrices = await hyperliquidRequest({ type: 'allMids' });

    // Transform to expected format
    const marketData = Object.entries(midPrices).map(([symbol, price]) => ({
      symbol,
      price: price as string,
      markPrice: price as string,
      fundingRate: '0.0001', // Mock for now - would need separate API call
      volume24h: '0', // Mock for now - would need separate API call
      change24h: '0', // Mock for now - would need separate API call
    }));

    res.json({
      success: true,
      data: marketData,
    });
  } catch (error: any) {
    logger.error('Failed to fetch market data:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch market data',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/hyperliquid/market/:symbol - Get specific market data
router.get('/market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get all mid prices and filter for symbol
    const midPrices = await hyperliquidRequest({ type: 'allMids' });

    if (!midPrices[symbol]) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Market data not found for symbol: ${symbol}`,
          statusCode: 404,
        },
      });
    }

    const marketData = {
      symbol,
      price: midPrices[symbol],
      markPrice: midPrices[symbol],
      fundingRate: '0.0001', // Mock for now
      volume24h: '0', // Mock for now
      change24h: '0', // Mock for now
    };

    res.json({
      success: true,
      data: marketData,
    });
  } catch (error: any) {
    logger.error('Failed to fetch market data:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch market data',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/hyperliquid/positions/:userAddress - Get user positions
router.get('/positions/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    // For now, return empty positions as we don't have actual user data
    // In a real implementation, this would query the user's positions from Hyperliquid
    const positions = [];

    res.json({
      success: true,
      data: positions,
    });
  } catch (error: any) {
    logger.error('Failed to fetch positions:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user positions',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/hyperliquid/open - Open a position
router.post('/open', async (req, res) => {
  try {
    const { strategyId, symbol, size, direction, leverage } = req.body;

    // Validate required fields
    if (!strategyId || !symbol || !size || !direction || !leverage) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: strategyId, symbol, size, direction, leverage',
          statusCode: 400,
        },
      });
    }

    // Mock response for opening a position
    // In a real implementation, this would interact with the Hyperliquid exchange endpoint
    const mockTrade = {
      id: `trade_${Date.now()}`,
      strategyId,
      symbol,
      size,
      direction,
      leverage,
      entryPrice: '0', // Would be filled by actual execution
      status: 'pending',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      trade: mockTrade,
    });
  } catch (error: any) {
    logger.error('Failed to open position:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to open position',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/hyperliquid/close - Close a position
router.post('/close', async (req, res) => {
  try {
    const { positionId, strategyId } = req.body;

    if (!positionId || !strategyId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: positionId, strategyId',
          statusCode: 400,
        },
      });
    }

    // Mock response for closing a position
    const mockTrade = {
      id: `trade_${Date.now()}`,
      positionId,
      strategyId,
      status: 'pending',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      trade: mockTrade,
    });
  } catch (error: any) {
    logger.error('Failed to close position:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to close position',
        statusCode: 500,
      },
    });
  }
});

export default router;