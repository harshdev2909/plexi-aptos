export interface WalletError extends Error {
  code?: number;
  details?: any;
}

export interface TransactionError extends Error {
  txHash?: string;
  code?: number;
  details?: any;
}

export class WalletNotConnectedError extends Error {
  constructor(message = 'Wallet not connected') {
    super(message);
    this.name = 'WalletNotConnectedError';
  }
}

export class InsufficientFundsError extends Error {
  constructor(required: string, available: string) {
    super(`Insufficient funds: required ${required}, available ${available}`);
    this.name = 'InsufficientFundsError';
  }
}

export class TransactionRejectedError extends Error {
  constructor(message = 'Transaction rejected by user') {
    super(message);
    this.name = 'TransactionRejectedError';
    this.code = 4001;
  }
}

export const handleWalletError = (error: any): string => {
  console.error('Wallet error:', error);

  // Handle specific error codes
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }

  if (error.code === 4100) {
    return 'Requested account or method not supported';
  }

  if (error.code === 4200) {
    return 'Wallet not authorized for this operation';
  }

  if (error.code === 4900) {
    return 'Wallet is disconnected';
  }

  // Handle error types
  if (error instanceof WalletNotConnectedError) {
    return 'Please connect your wallet first';
  }

  if (error instanceof InsufficientFundsError) {
    return error.message;
  }

  if (error instanceof TransactionRejectedError) {
    return 'Transaction was rejected. Please try again.';
  }

  // Handle network errors
  if (error.message?.includes('network') || error.message?.includes('Network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Handle insufficient funds
  if (error.message?.toLowerCase().includes('insufficient')) {
    return 'Insufficient funds for this transaction';
  }

  // Handle gas estimation errors
  if (error.message?.toLowerCase().includes('gas')) {
    return 'Transaction failed due to gas estimation error';
  }

  // Handle contract errors
  if (error.message?.toLowerCase().includes('contract')) {
    return 'Smart contract error. Please try again later.';
  }

  // Handle RPC errors
  if (error.message?.toLowerCase().includes('rpc') || error.code === -32603) {
    return 'RPC error. Please try again or switch networks.';
  }

  // Default error message
  return error.message || 'An unexpected error occurred';
};

export const handleApiError = (error: any): string => {
  console.error('API error:', error);

  if (!error.response) {
    return 'Network error. Please check your internet connection.';
  }

  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 400:
      return data?.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please reconnect your wallet.';
    case 403:
      return 'Access denied. You may not have permission for this action.';
    case 404:
      return 'Resource not found. The requested endpoint may not exist.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return data?.message || `Server error (${status}). Please try again.`;
  }
};

export const logError = (
  context: string,
  error: any,
  additionalData?: Record<string, any>
) => {
  console.group(`🚨 Error in ${context}`);
  console.error('Error:', error);
  if (additionalData) {
    console.error('Additional data:', additionalData);
  }
  console.error('Stack trace:', error.stack);
  console.groupEnd();

  // In production, you might want to send this to an error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry, LogRocket, etc.
    // errorTrackingService.captureException(error, { context, additionalData });
  }
};

export const createErrorToast = (error: any, context?: string): string => {
  let message: string;

  if (context === 'wallet') {
    message = handleWalletError(error);
  } else if (context === 'api') {
    message = handleApiError(error);
  } else {
    message = error.message || 'An unexpected error occurred';
  }

  // Log the error for debugging
  logError(context || 'unknown', error);

  return message;
};

export const isRetryableError = (error: any): boolean => {
  // Network errors are usually retryable
  if (!error.response) return true;

  const status = error.response?.status;

  // Retryable HTTP status codes
  return status === 408 || status === 429 || status >= 500;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`Operation failed, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await delay(delayMs);
    }
  }

  throw lastError;
};