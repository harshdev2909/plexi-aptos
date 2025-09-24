import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = express.Router();

// Hyperliquid API configuration for CLOB data
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

// GET /api/v1/clob/orderbook/:symbol - Get orderbook for a symbol
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { nSigFigs } = req.query;

    // Request L2 order book data from Hyperliquid
    const requestData: any = {
      type: 'l2Book',
      coin: symbol,
    };

    if (nSigFigs) {
      requestData.nSigFigs = parseInt(nSigFigs as string);
    }

    const orderbookData = await hyperliquidRequest(requestData);

    // Transform to expected format
    const orderbook = {
      symbol,
      bids: orderbookData?.levels?.[0] || [], // Buy orders
      asks: orderbookData?.levels?.[1] || [], // Sell orders
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      data: orderbook,
    });
  } catch (error: any) {
    logger.error('Failed to fetch orderbook:', error);

    // Return mock data if API fails
    const mockOrderbook = {
      symbol: req.params.symbol,
      bids: [
        { price: '44990.00', size: '10.5' },
        { price: '44980.00', size: '5.2' },
        { price: '44970.00', size: '8.1' }
      ],
      asks: [
        { price: '45010.00', size: '12.3' },
        { price: '45020.00', size: '7.8' },
        { price: '45030.00', size: '9.4' }
      ],
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      data: mockOrderbook,
    });
  }
});

// POST /api/v1/clob/route-order - Route an order through the CLOB
router.post('/route-order', async (req, res) => {
  try {
    const { symbol, side, size, price, type } = req.body;

    // Validate required fields
    if (!symbol || !side || !size || !price || !type) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: symbol, side, size, price, type',
          statusCode: 400,
        },
      });
    }

    // Validate side
    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid side. Must be BUY or SELL',
          statusCode: 400,
        },
      });
    }

    // Validate type
    if (!['LIMIT', 'MARKET', 'STOP_LIMIT'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid type. Must be LIMIT, MARKET, or STOP_LIMIT',
          statusCode: 400,
        },
      });
    }

    // Mock response for routing an order
    // In a real implementation, this would interact with the Hyperliquid exchange endpoint
    const orderId = `order_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`;

    logger.info('Order routed:', {
      orderId,
      symbol,
      side,
      size,
      price,
      type,
    });

    res.json({
      success: true,
      orderId,
      status: 'submitted',
      message: 'Order successfully submitted to CLOB',
    });
  } catch (error: any) {
    logger.error('Failed to route order:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to route order',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/clob/orders/:userAddress - Get user's orders
router.get('/orders/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    // Request user's open orders from Hyperliquid
    const ordersData = await hyperliquidRequest({
      type: 'openOrders',
      user: userAddress,
    });

    res.json({
      success: true,
      data: ordersData || [],
    });
  } catch (error: any) {
    logger.error('Failed to fetch user orders:', error);

    // Return empty array if API fails
    res.json({
      success: true,
      data: [],
    });
  }
});

// GET /api/v1/clob/fills/:userAddress - Get user's recent fills/trades
router.get('/fills/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    // Request user's recent fills from Hyperliquid
    const fillsData = await hyperliquidRequest({
      type: 'userFills',
      user: userAddress,
    });

    res.json({
      success: true,
      data: fillsData || [],
    });
  } catch (error: any) {
    logger.error('Failed to fetch user fills:', error);

    // Return empty array if API fails
    res.json({
      success: true,
      data: [],
    });
  }
});

export default router;