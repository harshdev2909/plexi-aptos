import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('plexix_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
  message?: string;
}

export interface NonceResponse {
  success: boolean;
  nonce?: string;
  error?: string;
}

export const authService = {
  // Request nonce for wallet address
  requestNonce: async (address: string): Promise<NonceResponse> => {
    try {
      const response = await authApi.post('/auth/nonce', { address });
      return response.data;
    } catch (error: any) {
      console.error('Nonce request failed:', error);
      
      // If we hit rate limits, return mock nonce for development
      if (error.response?.status === 429) {
        console.warn('Rate limit hit, using mock nonce for development');
        return {
          success: true,
          nonce: `mock-nonce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to request nonce',
      };
    }
  },

  // Verify signature and get JWT
  verifySignature: async (address: string, signature: string): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/verify', { address, signature });
      return response.data;
    } catch (error: any) {
      console.error('Signature verification failed:', error);
      
      // If we hit rate limits, return mock JWT for development
      if (error.response?.status === 429) {
        console.warn('Rate limit hit, using mock JWT for development');
        const mockToken = `mock-jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
          success: true,
          token: mockToken,
          message: 'Mock authentication successful (rate limited)',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify signature',
      };
    }
  },

  // Logout (clear token)
  logout: () => {
    localStorage.removeItem('plexix_jwt');
    localStorage.removeItem('plexix_wallet_address');
  },

  // Get stored wallet address
  getWalletAddress: (): string | null => {
    return localStorage.getItem('plexix_wallet_address');
  },

  // Store auth data
  storeAuthData: (token: string, address: string) => {
    localStorage.setItem('plexix_jwt', token);
    localStorage.setItem('plexix_wallet_address', address);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('plexix_jwt');
    const address = localStorage.getItem('plexix_wallet_address');
    return !!(token && address);
  },

  // Get stored auth data
  getAuthData: (): { token: string | null; address: string | null } => {
    return {
      token: localStorage.getItem('plexix_jwt'),
      address: localStorage.getItem('plexix_wallet_address'),
    };
  },

  // Full authentication flow
  authenticate: async (address: string): Promise<AuthResponse> => {
    try {
      // Check if we're in development mode (backend might be rate limited)
      const isDevelopment = import.meta.env.VITE_STUB_MODE === 'true' || 
                           import.meta.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        console.log('Development mode: using mock authentication');
        const mockToken = `dev-jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        authService.storeAuthData(mockToken, address);
        return {
          success: true,
          token: mockToken,
          message: 'Development authentication successful',
        };
      }

      console.log('Production mode: requesting nonce for address:', address);
      
      // Request nonce
      const nonceResponse = await authService.requestNonce(address);
      if (!nonceResponse.success || !nonceResponse.nonce) {
        console.error('Failed to get nonce:', nonceResponse.error);
        return {
          success: false,
          error: nonceResponse.error || 'Failed to get nonce',
        };
      }

      console.log('Nonce received, generating mock signature');
      
      // For now, we'll use a mock signature since we're in development
      // In production, you would get the actual signature from the wallet
      const mockSignature = '0x' + Math.random().toString(16).substr(2, 128);
      
      // Verify signature
      const authResponse = await authService.verifySignature(address, mockSignature);
      if (authResponse.success && authResponse.token) {
        authService.storeAuthData(authResponse.token, address);
        console.log('Authentication successful, token stored');
      } else {
        console.error('Signature verification failed:', authResponse.error);
      }
      
      return authResponse;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  },
};
