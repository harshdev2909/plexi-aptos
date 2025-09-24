import { create } from 'zustand';
import { apiService } from '../services/api';
import { priceService, PriceData } from '../services/priceService';

interface VaultStats {
  tvl: number;
  userBalance: number;
  userShares: number;
  hedgePercentage: number;
  farmingAllocation: number;
  totalRewards: number;
  aptPrice: PriceData | null;
}

interface VaultState {
  stats: VaultStats;
  isLoading: boolean;
  userAddress: string | null;
  updateStats: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (shares: number) => Promise<void>;
  claimRewards: () => Promise<void>;
  setUserAddress: (address: string) => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  stats: {
    tvl: 0,
    userBalance: 0,
    userShares: 0,
    hedgePercentage: 0,
    farmingAllocation: 0,
    totalRewards: 0,
    aptPrice: null,
  },
  isLoading: false,
  userAddress: null,
  
  setUserAddress: (address: string) => {
    set({ userAddress: address });
  },
  
  updateStats: async () => {
    set({ isLoading: true });
    try {
      // Get APT price data
      const aptPrice = await priceService.getAptPrice();
      
      // Get vault state
      const vaultState = await apiService.getVaultState();
      
      // Get user position if user is connected
      const { userAddress } = get();
      let userPosition = null;
      if (userAddress) {
        try {
          userPosition = await apiService.getUserPosition(userAddress);
        } catch (error) {
          console.warn('Failed to get user position:', error);
        }
      }
      
      set({
        stats: {
          tvl: parseFloat(vaultState.totalAssets) || 0,
          userBalance: userPosition ? parseFloat(userPosition.assetsEquivalent) || 0 : 0,
          userShares: userPosition ? parseFloat(userPosition.shares) || 0 : 0,
          hedgePercentage: 65, // Mock data for now
          farmingAllocation: 35, // Mock data for now
          totalRewards: userPosition ? Object.values(userPosition.pendingRewards || {}).reduce((sum, reward) => sum + parseFloat(String(reward)), 0) : 0,
          aptPrice,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to update vault stats:', error);
      set({ isLoading: false });
    }
  },
  
  deposit: async (amount: number) => {
    const { userAddress } = get();
    if (!userAddress) {
      throw new Error('User address not set');
    }
    
    set({ isLoading: true });
    try {
      const response = await apiService.deposit(userAddress, amount);
      if (response.success) {
        // Update local state
        const currentStats = get().stats;
        set({
          stats: {
            ...currentStats,
            userBalance: currentStats.userBalance + amount,
            userShares: currentStats.userShares + (response.data?.sharesMinted || amount),
            tvl: currentStats.tvl + amount,
          },
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Deposit failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  withdraw: async (shares: number) => {
    const { userAddress } = get();
    if (!userAddress) {
      throw new Error('User address not set');
    }
    
    set({ isLoading: true });
    try {
      const response = await apiService.withdraw(userAddress, shares);
      if (response.success) {
        // Update local state
        const currentStats = get().stats;
        const amountWithdrawn = response.data?.amountWithdrawn || shares;
        set({
          stats: {
            ...currentStats,
            userBalance: Math.max(0, currentStats.userBalance - amountWithdrawn),
            userShares: Math.max(0, currentStats.userShares - shares),
            tvl: Math.max(0, currentStats.tvl - amountWithdrawn),
          },
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Withdraw failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  claimRewards: async () => {
    set({ isLoading: true });
    // Mock claim for now
    setTimeout(() => {
      const currentStats = get().stats;
      set({
        stats: {
          ...currentStats,
          totalRewards: 0,
        },
        isLoading: false,
      });
    }, 1500);
  },
}));