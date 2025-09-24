import { useState, useEffect } from 'react';
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

  // Check if Petra is installed
  const isPetraInstalled = () => {
    const installed = typeof window !== 'undefined' && 'aptos' in window;
    console.log('usePetraWallet: isPetraInstalled check:', { 
      windowExists: typeof window !== 'undefined', 
      aptosInWindow: typeof window !== 'undefined' && 'aptos' in window,
      installed,
      windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(key => key.includes('aptos') || key.includes('petra')) : []
    });
    return installed;
  };

  // Get Petra wallet instance
  const getPetraWallet = (): PetraWallet | null => {
    if (isPetraInstalled()) {
      console.log('usePetraWallet: Getting Petra wallet instance:', window.aptos);
      return window.aptos!;
    }
    
    // Check for other possible wallet objects
    if (typeof window !== 'undefined') {
      console.log('usePetraWallet: Checking for other wallet objects...');
      console.log('usePetraWallet: window.aptos:', window.aptos);
      console.log('usePetraWallet: window.petra:', (window as any).petra);
      console.log('usePetraWallet: window.aptosWallet:', (window as any).aptosWallet);
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
          console.log('usePetraWallet: Using stored auth data for address:', address);
          setIsAuthenticated(true);
          return;
        }

        try {
          console.log('usePetraWallet: Checking auth for address:', address);
          const authResult = await authService.authenticate(address);
          console.log('usePetraWallet: Auth result:', authResult);
          setIsAuthenticated(authResult.success);
          console.log('usePetraWallet: Set isAuthenticated to:', authResult.success);
        } catch (error) {
          console.error('usePetraWallet: Auth check failed:', error);
          setIsAuthenticated(false);
        }
      } else {
        console.log('usePetraWallet: No address, setting isAuthenticated to false');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [address]);

  // Initialize wallet connection on mount
  useEffect(() => {
    const initializeWallet = async () => {
      console.log('usePetraWallet: Initializing wallet...');
      console.log('usePetraWallet: Current URL:', window.location.href);
      
      // Wait for Petra wallet to be available (it might take time to load)
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isPetraInstalled() && attempts < maxAttempts) {
        console.log(`usePetraWallet: Waiting for Petra wallet... attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      console.log('usePetraWallet: Petra installed?', isPetraInstalled());
      
      if (!isPetraInstalled()) {
        console.log('usePetraWallet: Petra wallet not installed after waiting');
        return;
      }

      const wallet = getPetraWallet();
      console.log('usePetraWallet: Wallet instance:', wallet);
      if (!wallet) return;

      try {
        // Check if already connected
        console.log('usePetraWallet: Checking if already connected...');
        const connected = await wallet.isConnected();
        console.log('usePetraWallet: Already connected?', connected);
        
        if (connected) {
          const account = await wallet.account();
          console.log('usePetraWallet: Account:', account);
          setAddress(account.address);
          setIsConnected(true);
          
          // If wallet is already connected, authenticate immediately
          console.log('usePetraWallet: Wallet already connected, authenticating...');
          try {
            const authResult = await authService.authenticate(account.address);
            console.log('usePetraWallet: Initial auth result:', authResult);
            setIsAuthenticated(authResult.success);
          } catch (error) {
            console.error('usePetraWallet: Initial auth failed:', error);
            setIsAuthenticated(false);
          }
        }

        // Set up event listeners
        wallet.onAccountChange((newAccount) => {
          console.log('usePetraWallet: Account changed:', newAccount);
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
  }, []);

  const connect = async (): Promise<void> => {
    console.log('usePetraWallet: Connect called');
    console.log('usePetraWallet: Current URL before connect:', window.location.href);
    console.log('usePetraWallet: Petra installed?', isPetraInstalled());
    
    if (!isPetraInstalled()) {
      console.log('usePetraWallet: Petra not installed, opening installation page');
      // Open Petra installation page
      window.open('https://petra.app/', '_blank');
      throw new Error('Petra wallet not installed. Please install Petra and try again.');
    }

    const wallet = getPetraWallet();
    console.log('usePetraWallet: Wallet instance for connect:', wallet);
    if (!wallet) {
      throw new Error('Petra wallet not available');
    }

    try {
      console.log('usePetraWallet: Starting connection...');
      setIsLoading(true);
      
      const response = await wallet.connect();
      console.log('usePetraWallet: Connection response:', response);
      
      // Update state immediately after connection
      setAddress(response.address);
      setIsConnected(true);
      
      console.log('usePetraWallet: Connected to Petra wallet:', response.address);
      console.log('usePetraWallet: State updated - isConnected:', true, 'address:', response.address);
      console.log('usePetraWallet: Current URL after connect:', window.location.href);
      
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      
      console.log('Disconnected from Petra wallet');
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
      console.log('Attempting to sign transaction with wallet:', {
        wallet: !!wallet,
        address,
        transactionType: typeof transaction,
        transactionKeys: transaction ? Object.keys(transaction) : 'null'
      });
      
      const response = await wallet.signAndSubmitTransaction(transaction);
      console.log('Transaction signed successfully:', response);
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
      console.log('Starting authentication for address:', address);
      const authResult = await authService.authenticate(address);
      console.log('Authentication result:', authResult);
      
      if (authResult.success) {
        setIsAuthenticated(true);
        console.log('Authentication successful, isAuthenticated set to true');
      } else {
        setIsAuthenticated(false);
        console.log('Authentication failed:', authResult.error);
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
    isPetraInstalled: isPetraInstalled(),
    
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
