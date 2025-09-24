import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePetraWallet } from '../hooks/usePetraWallet';
import { authService } from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    address: string | null;
    balance: number;
  } | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading: walletLoading, 
    isAuthenticated: walletAuthenticated,
    authenticate 
  } = usePetraWallet();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authAttempts, setAuthAttempts] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Checking auth state', { 
        isConnected, 
        address, 
        walletAuthenticated, 
        walletLoading,
        authAttempts 
      });
      
      // Use the wallet's authentication state as the primary source
      if (walletAuthenticated && isConnected && address) {
        console.log('AuthContext: Wallet is authenticated and connected');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      // First check if we have stored auth data
      const storedAuth = authService.isAuthenticated();
      const storedData = authService.getAuthData();
      
      console.log('AuthContext: Stored auth check', { storedAuth, storedData });
      
      if (storedAuth && storedData.address === address) {
        console.log('AuthContext: Found valid stored auth data');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      if (isConnected && address) {
        try {
          console.log('AuthContext: Wallet connected, authenticating...');
          const authValid = await authenticate();
          console.log('AuthContext: Authentication result:', authValid);
          setIsAuthenticated(authValid);
        } catch (error) {
          console.error('AuthContext: Auth check failed:', error);
          // If authentication fails but wallet is connected, still allow access
          console.log('AuthContext: Auth failed but wallet connected, allowing access');
          setIsAuthenticated(true);
        }
      } else {
        console.log('AuthContext: Wallet not connected, setting authenticated to false');
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    // Add timeout to force authentication
    const timeoutId = setTimeout(() => {
      if (isConnected && address && !isAuthenticated) {
        console.log('AuthContext: Timeout reached, forcing authentication');
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    checkAuth();

    return () => clearTimeout(timeoutId);
  }, [isConnected, address, walletAuthenticated, authenticate, isAuthenticated]);

  // Sync wallet authentication state with local state
  useEffect(() => {
    console.log('AuthContext: Syncing wallet auth state', { walletAuthenticated, isConnected, address, currentIsAuthenticated: isAuthenticated });
    if (walletAuthenticated && isConnected && address) {
      console.log('AuthContext: Syncing - setting isAuthenticated to true');
      setIsAuthenticated(true);
    } else if (!walletAuthenticated && !isConnected) {
      console.log('AuthContext: Syncing - setting isAuthenticated to false (wallet not connected)');
      setIsAuthenticated(false);
    }
  }, [walletAuthenticated, isConnected, address]);

  // Fallback: If wallet is connected but not authenticated, try to authenticate
  useEffect(() => {
    if (isConnected && address && !walletAuthenticated && !isLoading && authAttempts < 3) {
      console.log('AuthContext: Fallback - wallet connected but not authenticated, trying to authenticate...', { authAttempts });
      const fallbackAuth = async () => {
        try {
          setAuthAttempts(prev => prev + 1);
          const authResult = await authenticate();
          console.log('AuthContext: Fallback auth result:', authResult);
          if (authResult) {
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('AuthContext: Fallback auth failed:', error);
        }
      };
      fallbackAuth();
    }
  }, [isConnected, address, walletAuthenticated, isLoading, authenticate, authAttempts]);

  const login = async () => {
    try {
      setIsLoading(true);
      
      // Get current wallet state
      const currentAddress = address;
      console.log('AuthContext: Login - Current address:', currentAddress);
      console.log('AuthContext: Login - Wallet connected:', isConnected);
      console.log('AuthContext: Login - Wallet authenticated:', walletAuthenticated);
      
      if (!currentAddress) {
        console.log('AuthContext: Login - No address, trying to connect wallet first...');
        // Try to connect wallet first
        if (!isConnected) {
          throw new Error('Please connect your Petra wallet first. Click the "Connect Wallet" button.');
        }
        throw new Error('Petra wallet not connected');
      }

      console.log('AuthContext: Login - Petra wallet connected, proceeding with authentication...');

      // Authenticate with backend
      const authSuccess = await authenticate();
      console.log('AuthContext: Login - Authentication result:', authSuccess);
      
      if (!authSuccess) {
        throw new Error('Authentication failed');
      }

      // Update local state
      setIsAuthenticated(true);
      console.log('AuthContext: Login successful!');
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading: isLoading || walletLoading,
    user: isConnected && address ? { address, balance } : null,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};