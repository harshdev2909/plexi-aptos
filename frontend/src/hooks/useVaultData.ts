import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, VaultState, UserPosition, VaultEvent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Hook for vault state
export const useVaultState = () => {
  return useQuery({
    queryKey: ['vaultState'],
    queryFn: apiService.getVaultState,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 1, // Only retry once to avoid too many requests
    retryDelay: 2000,
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

// Hook for user position
export const useUserPosition = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userPosition', user?.address],
    queryFn: () => user?.address ? apiService.getUserPosition(user.address) : null,
    enabled: !!user?.address,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
    retry: 1, // Only retry once
    retryDelay: 2000,
    refetchOnWindowFocus: false,
  });
};

// Hook for vault events
export const useVaultEvents = (limit: number = 50) => {
  return useQuery({
    queryKey: ['vaultEvents', limit],
    queryFn: () => apiService.getVaultEvents(limit),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    retry: 1, // Only retry once
    retryDelay: 2000,
    refetchOnWindowFocus: false,
  });
};

// Hook for real-time vault data (combines multiple queries)
export const useVaultData = () => {
  const vaultState = useVaultState();
  const userPosition = useUserPosition();
  const vaultEvents = useVaultEvents(20); // Last 20 events

  const isLoading = vaultState.isLoading || userPosition.isLoading || vaultEvents.isLoading;
  const isError = vaultState.isError || userPosition.isError || vaultEvents.isError;
  const error = vaultState.error || userPosition.error || vaultEvents.error;

  return {
    vaultState: vaultState.data,
    userPosition: userPosition.data,
    vaultEvents: vaultEvents.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      vaultState.refetch();
      userPosition.refetch();
      vaultEvents.refetch();
    },
  };
};
