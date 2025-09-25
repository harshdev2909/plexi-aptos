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
  const [isLoading, setIsLoading] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      
      // Use the wallet's authentication state as the primary source
      if (walletAuthenticated && isConnected && address) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      // First check if we have stored auth data
      const storedAuth = authService.isAuthenticated();
      const storedData = authService.getAuthData();
      
      
      if (storedAuth && storedData.address === address) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      if (isConnected && address) {
        try {
          const authValid = await authenticate();
          setIsAuthenticated(authValid);
        } catch (error) {
          console.error('AuthContext: Auth check failed:', error);
          // If authentication fails but wallet is connected, still allow access
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    // Add timeout to force authentication
    const timeoutId = setTimeout(() => {
      if (isConnected && address && !isAuthenticated) {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    checkAuth();

    return () => clearTimeout(timeoutId);
  }, [isConnected, address, walletAuthenticated, authenticate, isAuthenticated]);

  // Sync wallet authentication state with local state
  useEffect(() => {
    if (walletAuthenticated && isConnected && address) {
      setIsAuthenticated(true);
    } else if (!walletAuthenticated && !isConnected) {
      setIsAuthenticated(false);
    }
  }, [walletAuthenticated, isConnected, address]);

  // Fallback: If wallet is connected but not authenticated, try to authenticate
  useEffect(() => {
    if (isConnected && address && !walletAuthenticated && !isLoading && authAttempts < 3) {
      const fallbackAuth = async () => {
        try {
          setAuthAttempts(prev => prev + 1);
          const authResult = await authenticate();
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
      
      if (!currentAddress) {
        // Try to connect wallet first
        if (!isConnected) {
          throw new Error('Please connect your Petra wallet first. Click the "Connect Wallet" button.');
        }
        throw new Error('Petra wallet not connected');
      }


      // Authenticate with backend
      const authSuccess = await authenticate();
      
      if (!authSuccess) {
        throw new Error('Authentication failed');
      }

      // Update local state
      setIsAuthenticated(true);
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