import { useQuery } from '@tanstack/react-query';
import { apiService, MarketData, Orderbook, Trade } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Hook for market data
export const useMarketData = (symbol?: string) => {
  return useQuery({
    queryKey: ['marketData', symbol],
    queryFn: () => apiService.getMarketData(symbol),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time prices
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for orderbook data
export const useOrderbook = (symbol: string) => {
  return useQuery({
    queryKey: ['orderbook', symbol],
    queryFn: () => apiService.getOrderbook(symbol),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time orderbook
    staleTime: 2000, // Consider data stale after 2 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!symbol,
  });
};

// Hook for user positions
export const usePositions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['positions', user?.address],
    queryFn: () => user?.address ? apiService.getPositions(user.address) : null,
    enabled: !!user?.address,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for user trades
export const useTrades = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['trades', user?.address],
    queryFn: () => user?.address ? apiService.getTrades(user.address) : null,
    enabled: !!user?.address,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for all trading data
export const useTradingData = (symbol?: string) => {
  const marketData = useMarketData(symbol);
  const orderbook = useOrderbook(symbol || 'BTC-USD');
  const positions = usePositions();
  const trades = useTrades();

  const isLoading = marketData.isLoading || orderbook.isLoading || positions.isLoading || trades.isLoading;
  const isError = marketData.isError || orderbook.isError || positions.isError || trades.isError;
  const error = marketData.error || orderbook.error || positions.error || trades.error;

  return {
    marketData: marketData.data,
    orderbook: orderbook.data,
    positions: positions.data,
    trades: trades.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      marketData.refetch();
      orderbook.refetch();
      positions.refetch();
      trades.refetch();
    },
  };
};
