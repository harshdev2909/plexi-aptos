import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { authService } from '../services/auth';
import { useState, useEffect } from 'react';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: import.meta.env.VITE_APTOS_RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1'
});
const aptos = new Aptos(aptosConfig);

// Mock wallet data for now
const mockWallets = [
  { name: 'Petra', adapter: 'petra' },
  { name: 'Pontem', adapter: 'pontem' },
  { name: 'Martian', adapter: 'martian' },
];

export const useWalletAdapter = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update balance when address changes
  useEffect(() => {
    const updateBalance = async () => {
      if (address) {
        try {
          const balance = await aptos.getAccountAPTAmount({ 
            accountAddress: address 
          });
          setBalance(Number(balance) / 1e8); // Convert from octas to APT
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };

    updateBalance();
  }, [address]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (address) {
        try {
          const authResult = await authService.authenticate(address);
          setIsAuthenticated(authResult.success);
        } catch (error) {
          console.error('Auth check failed:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [address]);

  const handleConnect = async (walletName: string) => {
    try {
      setIsLoading(true);
      
      // For now, simulate wallet connection with mock data
      // In a real implementation, you would use the actual wallet adapter
      console.log(`Connecting to ${walletName}...`);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock wallet connection for development
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      const mockBalance = Math.random() * 100; // Random balance between 0-100 APT
      
      setAddress(mockAddress);
      setBalance(mockBalance);
      setIsConnected(true);
      
      console.log(`Connected to ${walletName}:`, mockAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting wallet...');
      authService.logout();
      setAddress(null);
      setBalance(0);
      setIsConnected(false);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  const handleSignMessage = async (message: string) => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    try {
      // Mock signature for development
      console.log('Signing message:', message);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate signing delay
      
      // Generate a mock signature
      const mockSignature = '0x' + Math.random().toString(16).substr(2, 128);
      console.log('Message signed with signature:', mockSignature);
      
      return mockSignature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };

  const handleAuthenticate = async () => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    try {
      const authResult = await authService.authenticate(address);
      setIsAuthenticated(authResult.success);
      return authResult.success;
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  return {
    // Wallet state
    isConnected,
    address,
    balance,
    isLoading,
    isAuthenticated,
    
    // Available wallets
    wallets: mockWallets,
    
    // Actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage: handleSignMessage,
    authenticate: handleAuthenticate,
    
    // Aptos client for direct use
    aptos,
  };
};