import axios from 'axios';
import { apiCache, CACHE_CONFIGS, createCacheKey } from '../utils/cache';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plexix_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear auth data
      localStorage.removeItem('plexix_jwt');
      localStorage.removeItem('plexix_wallet_address');
      
      // Only redirect in production, not during development
      const isDevelopment = import.meta.env.NODE_ENV === 'development' || 
                           import.meta.env.VITE_STUB_MODE === 'true';
      
      if (!isDevelopment && window.location.pathname !== '/login') {
        console.log('API: 401 error, redirecting to login');
        window.location.href = '/login';
      } else {
        console.log('API: 401 error in development, not redirecting');
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to check if we're in stub mode
const isStubMode = () => {
  return import.meta.env.VITE_STUB_MODE === 'true' ||
         import.meta.env.NODE_ENV === 'development';
};

// Cached API call wrapper
const cachedApiCall = async <T>(
  endpoint: string,
  cacheConfig: { ttl: number },
  apiCall: () => Promise<T>,
  mockDataFn?: () => T,
  params?: Record<string, any>
): Promise<T> => {
  const cacheKey = createCacheKey(endpoint, params);

  // Try to get from cache first
  const cachedData = apiCache.get<T>(cacheKey);
  if (cachedData) {
    console.log(`API: Using cached data for ${endpoint}`);
    return cachedData;
  }

  try {
    const data = await apiCall();
    // Cache the successful response
    apiCache.set(cacheKey, data, cacheConfig);
    console.log(`API: Cached fresh data for ${endpoint}`);
    return data;
  } catch (error) {
    console.warn(`API: ${endpoint} failed, using ${mockDataFn ? 'mock data' : 'error'}:`, error);
    if (mockDataFn && isStubMode()) {
      return mockDataFn();
    }
    throw error;
  }
};

// Helper function to get mock vault state
const getMockVaultState = (): VaultState => ({
  totalAssets: '292.00', // Match the real backend data
  totalShares: '0',
  assetToken: 'USDC', // Vault assets are in USDC
  isInitialized: true,
  strategiesCount: 3,
  rewardTokens: ['APT', 'USDC'],
  lastRebalanceTimestamp: Date.now() - 3600000, // 1 hour ago
});

// Helper function to get mock user position
const getMockUserPosition = (address: string): UserPosition => ({
  userShares: '1000.00',
  assetsEquivalent: '1000.00',
  pendingRewards: {
    'APT': '5.25',
    'USDC': '10.50'
  }
});

// Helper function to get mock vault events
const getMockVaultEvents = (limit: number): VaultEvent[] => {
  const events: VaultEvent[] = [];
  for (let i = 0; i < limit; i++) {
    events.push({
      id: `event-${i}`,
      eventType: i % 2 === 0 ? 'DepositEvent' : 'WithdrawEvent',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      payload: {
        amount: (Math.random() * 1000).toFixed(2),
        user: '0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2'
      },
      createdAt: new Date(Date.now() - i * 60000).toISOString()
    });
  }
  return events;
};

// Types
export interface VaultState {
  totalAssets: string;
  totalShares: string;
  assetToken: string;
  isInitialized: boolean;
  strategiesCount: number;
  rewardTokens: string[];
  lastRebalanceTimestamp: number;
}

export interface UserPosition {
  userShares: string;
  assetsEquivalent: string;
  pendingRewards: Record<string, string>;
}

export interface VaultEvent {
  id: string;
  eventType: string;
  txHash: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface StrategyMetadata {
  name: string;
  creator: string;
  riskLevel: number;
  isActive: boolean;
  totalDeposits: string;
}

export interface Trade {
  id: string;
  strategyId: number;
  positionId?: string;
  symbol: string;
  size: string;
  direction: 'LONG' | 'SHORT';
  leverage: number;
  entryPrice?: string;
  liquidationPrice?: string;
  pnl?: string;
  status: 'pending' | 'opened' | 'closed' | 'cancelled' | 'failed';
  txHash?: string;
  userAddress?: string;
  vaultAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketData {
  symbol: string;
  price: string;
  markPrice: string;
  fundingRate: string;
  volume24h: string;
  change24h: string;
}

export interface Orderbook {
  symbol: string;
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  timestamp: number;
}

// API Service
export const apiService = {
  // Vault endpoints
  getVaultState: async (): Promise<VaultState> => {
    return cachedApiCall(
      'getVaultState',
      CACHE_CONFIGS.VAULT_STATE,
      async () => {
        const response = await api.get('/vault/state');
        return response.data.data || response.data;
      },
      getMockVaultState
    );
  },

  getUserPosition: async (address: string): Promise<UserPosition> => {
    return cachedApiCall(
      'getUserPosition',
      CACHE_CONFIGS.USER_POSITION,
      async () => {
        const response = await api.get(`/vault/user/${address}`);
        return response.data.data || response.data;
      },
      () => getMockUserPosition(address),
      { address }
    );
  },

  getVaultEvents: async (limit: number = 50): Promise<VaultEvent[]> => {
    return cachedApiCall(
      'getVaultEvents',
      CACHE_CONFIGS.EVENTS,
      async () => {
        const response = await api.get(`/vault/events?limit=${limit}`);
        return response.data.data || response.data;
      },
      () => getMockVaultEvents(limit),
      { limit }
    );
  },

  // Trading endpoints
  getMarketData: async (symbol?: string): Promise<MarketData | MarketData[]> => {
    return cachedApiCall(
      'getMarketData',
      CACHE_CONFIGS.MARKET_DATA,
      async () => {
        const url = symbol ? `/hyperliquid/market/${symbol}` : '/hyperliquid/market';
        const response = await api.get(url);
        return response.data.data || response.data;
      },
      () => ({
        symbol: symbol || 'BTC-USD',
        price: '45000.00',
        markPrice: '45000.00',
        fundingRate: '0.0001',
        volume24h: '1000000.00',
        change24h: '2.5'
      }),
      symbol ? { symbol } : undefined
    );
  },

  getOrderbook: async (symbol: string): Promise<Orderbook> => {
    return cachedApiCall(
      'getOrderbook',
      CACHE_CONFIGS.ORDERBOOK,
      async () => {
        const response = await api.get(`/clob/orderbook/${symbol}`);
        return response.data.data || response.data;
      },
      () => ({
        symbol,
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
        timestamp: Date.now()
      }),
      { symbol }
    );
  },

  getPositions: async (userAddress?: string): Promise<any[]> => {
    return cachedApiCall(
      'getPositions',
      CACHE_CONFIGS.POSITIONS,
      async () => {
        const url = userAddress ? `/hyperliquid/positions/${userAddress}` : '/hyperliquid/positions';
        const response = await api.get(url);
        return response.data.data || response.data;
      },
      () => [],
      userAddress ? { userAddress } : undefined
    );
  },

  getTrades: async (userAddress?: string): Promise<Trade[]> => {
    return cachedApiCall(
      'getTrades',
      CACHE_CONFIGS.TRADES,
      async () => {
        const url = userAddress ? `/trades?userAddress=${userAddress}` : '/trades';
        const response = await api.get(url);
        return response.data.data || response.data;
      },
      () => [],
      userAddress ? { userAddress } : undefined
    );
  },

  // Vault transaction endpoints
  deposit: async (walletAddress: string, amount: number): Promise<{ success: boolean; data?: { txHash: string; sharesMinted: number }; error?: string }> => {
    const response = await api.post('/vault/deposit', { walletAddress, amount });
    return response.data;
  },

  withdraw: async (walletAddress: string, shares: number): Promise<{ success: boolean; data?: { txHash: string; amountWithdrawn: number }; error?: string }> => {
    const response = await api.post('/vault/withdraw', { walletAddress, shares });
    return response.data;
  },

  mint: async (walletAddress: string, shares: number): Promise<{ success: boolean; data?: { txHash: string; sharesMinted: number }; error?: string }> => {
    const response = await api.post('/vault/mint', { walletAddress, shares });
    return response.data;
  },

  redeem: async (walletAddress: string, shares: number, ownerAddress: string): Promise<{ success: boolean; data?: { txHash: string; amountWithdrawn: number }; error?: string }> => {
    const response = await api.post('/vault/redeem', { walletAddress, shares, ownerAddress });
    return response.data;
  },

  // Admin endpoints (require JWT)
  rebalance: async (hedgePercent: number, farmPercent: number): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const response = await api.post('/admin/rebalance', { hedgePercent, farmPercent });
    return response.data;
  },

  harvest: async (strategyId: number): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const response = await api.post('/admin/harvest', { strategyId });
    return response.data;
  },

  registerStrategy: async (name: string, riskLevel: number, metadata: Record<string, unknown>): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const response = await api.post('/admin/register-strategy', { name, riskLevel, metadata });
    return response.data;
  },

  addRewardToken: async (tokenAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const response = await api.post('/admin/add-reward-token', { tokenAddress });
    return response.data;
  },

  // Hyperliquid endpoints
  openPosition: async (strategyId: number, symbol: string, size: string, direction: 'LONG' | 'SHORT', leverage: number): Promise<{ success: boolean; trade?: Trade; error?: string }> => {
    const response = await api.post('/hyperliquid/open', { strategyId, symbol, size, direction, leverage });
    return response.data;
  },

  closePosition: async (positionId: string, strategyId: number): Promise<{ success: boolean; trade?: Trade; error?: string }> => {
    const response = await api.post('/hyperliquid/close', { positionId, strategyId });
    return response.data;
  },

  // CLOB endpoints
  routeOrder: async (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    size: string;
    price: string;
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    const response = await api.post('/clob/route-order', order);
    return response.data;
  },

  // Transaction methods
  createDepositTransaction: async (data: { userAddress: string; amount: string }) => {
    const response = await api.post('/tx/deposit', data);
    return response;
  },

  createWithdrawTransaction: async (data: { userAddress: string; amount: string }) => {
    const response = await api.post('/tx/withdraw', data);
    return response;
  },

  createMintTransaction: async (data: { userAddress: string; amount: string }) => {
    const response = await api.post('/tx/mint', data);
    return response;
  },

  createRedeemTransaction: async (data: { userAddress: string; amount: string; ownerAddress: string }) => {
    const response = await api.post('/tx/redeem', data);
    return response;
  },

  getTransactionStatus: async (txHash: string) => {
    const response = await api.get(`/tx/status/${txHash}`);
    return response.data;
  },

  getUserTransactions: async (userAddress: string) => {
    const response = await api.get(`/tx/user/${userAddress}`);
    return response.data;
  },

  // Health check
  health: async (): Promise<{ status: string; timestamp: string; service: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;