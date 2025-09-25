import { useState, useEffect, useCallback } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { authService } from '../services/auth';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: import.meta.env.VITE_APTOS_RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1'
});
const aptos = new Aptos(aptosConfig);

// Petra wallet interface
interface PetraWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  account: () => Promise<{ address: string }>;
  isConnected: () => Promise<boolean>;
  network: () => Promise<{ name: string }>;
  onNetworkChange: (callback: (network: { name: string }) => void) => void;
  onAccountChange: (callback: (account: { address: string } | null) => void) => void;
  onDisconnect: (callback: () => void) => void;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  signMessage: (message: { message: string }) => Promise<{ signature: string }>;
}

// Extend window interface
declare global {
  interface Window {
    aptos?: PetraWallet;
  }
}

export const usePetraWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [network, setNetwork] = useState<string>('Testnet');

  // Check if Petra is installed (cached)
  const [petraInstalled, setPetraInstalled] = useState<boolean>(false);

  const checkPetraInstalled = useCallback(() => {
    const installed = typeof window !== 'undefined' && 'aptos' in window;
    setPetraInstalled(installed);
    return installed;
  }, []);

  const isPetraInstalled = () => petraInstalled;

  // Check for Petra installation on mount
  useEffect(() => {
    checkPetraInstalled();
  }, [checkPetraInstalled]);

  // Get Petra wallet instance
  const getPetraWallet = (): PetraWallet | null => {
    if (isPetraInstalled()) {
      return window.aptos!;
    }
    return null;
  };

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
        // Check if we already have a valid token for this address
        const storedData = authService.getAuthData();
        if (storedData.token && storedData.address === address) {
          setIsAuthenticated(true);
          return;
        }

        try {
          const authResult = await authService.authenticate(address);
          setIsAuthenticated(authResult.success);
        } catch (error) {
          console.error('usePetraWallet: Auth check failed:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [address]);

  // Initialize wallet connection when Petra is available
  useEffect(() => {
    if (!petraInstalled) return;

    const initializeWallet = async () => {
      const wallet = getPetraWallet();
      if (!wallet) return;

      try {
        // Check if already connected
        const connected = await wallet.isConnected();

        if (connected) {
          const account = await wallet.account();
          setAddress(account.address);
          setIsConnected(true);

          // If wallet is already connected, authenticate immediately
          try {
            const authResult = await authService.authenticate(account.address);
            setIsAuthenticated(authResult.success);
          } catch (error) {
            console.error('usePetraWallet: Initial auth failed:', error);
            setIsAuthenticated(false);
          }
        }

        // Set up event listeners
        wallet.onAccountChange((newAccount) => {
          if (newAccount) {
            setAddress(newAccount.address);
            setIsConnected(true);
            // Don't reset authentication state on account change
            // The authentication will be handled by the useEffect
          } else {
            setAddress(null);
            setIsConnected(false);
            setIsAuthenticated(false);
          }
        });

        wallet.onDisconnect(() => {
          setAddress(null);
          setIsConnected(false);
          setIsAuthenticated(false);
        });

        wallet.onNetworkChange((newNetwork) => {
          setNetwork(newNetwork.name);
        });

        // Get current network
        const currentNetwork = await wallet.network();
        setNetwork(currentNetwork.name);

      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    initializeWallet();
  }, [petraInstalled]);

  const connect = async (): Promise<void> => {
    if (!isPetraInstalled()) {
      // Open Petra installation page
      window.open('https://petra.app/', '_blank');
      throw new Error('Petra wallet not installed. Please install Petra and try again.');
    }

    const wallet = getPetraWallet();
    if (!wallet) {
      throw new Error('Petra wallet not available');
    }

    try {
      setIsLoading(true);

      const response = await wallet.connect();

      // Update state immediately after connection
      setAddress(response.address);
      setIsConnected(true);
      
    } catch (error: any) {
      console.error('usePetraWallet: Petra connection failed:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      
      throw new Error(error.message || 'Failed to connect to Petra wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    const wallet = getPetraWallet();
    if (!wallet) return;

    try {
      await wallet.disconnect();
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      authService.logout();
      
    } catch (error) {
      console.error('Petra disconnection failed:', error);
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    const wallet = getPetraWallet();
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await wallet.signMessage({
        message,
      });
      
      return response.signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the signing request');
      }
      
      throw new Error(error.message || 'Failed to sign message');
    }
  };

  const signAndSubmitTransaction = async (transaction: any): Promise<{ hash: string }> => {
    const wallet = getPetraWallet();
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      
      const response = await wallet.signAndSubmitTransaction(transaction);
      return response;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the transaction');
      }
      
      throw new Error(error.message || 'Transaction failed');
    }
  };

  const authenticate = async (): Promise<boolean> => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    try {
      const authResult = await authService.authenticate(address);
      
      if (authResult.success) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
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
    network,
    
    // Wallet info
    isPetraInstalled: petraInstalled,
    
    // Actions
    connect,
    disconnect,
    signMessage,
    signAndSubmitTransaction,
    authenticate,
    
    // Aptos client for direct use
    aptos,
  };
};
