import { create } from 'zustand';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { authService } from '../services/auth';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  aptos: Aptos | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  authenticate: () => Promise<boolean>;
  signMessage: (message: string) => Promise<string | null>;
}

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: import.meta.env.VITE_APTOS_RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1'
});
const aptos = new Aptos(aptosConfig);

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: 0,
  isLoading: false,
  isAuthenticated: false,
  aptos,
  
  connect: async () => {
    set({ isLoading: true });
    
    try {
      // Check if wallet is already connected
      const accounts = await aptos.getConnectedAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].accountAddress.toString();
        const balance = await aptos.getAccountAPTAmount({ accountAddress: address });
        
        set({
          isConnected: true,
          address,
          balance: Number(balance) / 1e8, // Convert from octas to APT
          isLoading: false,
        });
      } else {
        // For now, simulate wallet connection with mock data
        // In a real implementation, you would use the Aptos wallet adapter
        console.log('Attempting wallet connection...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock wallet connection for development
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
        const mockBalance = Math.random() * 100; // Random balance between 0-100 APT
        
        set({
          isConnected: true,
          address: mockAddress,
          balance: mockBalance,
          isLoading: false,
        });
        
        console.log('Wallet connected successfully:', mockAddress);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      set({
        isConnected: false,
        address: null,
        balance: 0,
        isLoading: false,
      });
      throw error; // Re-throw to show error in UI
    }
  },
  
  disconnect: () => {
    // In a real implementation, you would disconnect the wallet
    console.log('Disconnecting wallet...');
    authService.logout();
    set({
      isConnected: false,
      address: null,
      balance: 0,
      isAuthenticated: false,
    });
  },

  authenticate: async () => {
    const { address } = get();
    if (!address) return false;

    try {
      const authResult = await authService.authenticate(address);
      if (authResult.success) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  },

  signMessage: async (message: string) => {
    try {
      const { address } = get();
      if (!address) return null;

      // Mock signature for development
      console.log('Signing message:', message);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate signing delay
      
      // Generate a mock signature
      const mockSignature = '0x' + Math.random().toString(16).substr(2, 128);
      console.log('Message signed with signature:', mockSignature);
      
      return mockSignature;
    } catch (error) {
      console.error('Message signing failed:', error);
      return null;
    }
  },
}));