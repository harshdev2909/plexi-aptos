import React, { createContext, useContext, ReactNode } from 'react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';

// Define the wallet adapters (only installed ones)
const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet(),
];

interface WalletAdapterContextType {
  // Add any additional context if needed
}

const WalletAdapterContext = createContext<WalletAdapterContextType | undefined>(undefined);

export const useWalletAdapter = () => {
  const context = useContext(WalletAdapterContext);
  if (!context) {
    throw new Error('useWalletAdapter must be used within a WalletAdapterProvider');
  }
  return context;
};

interface WalletAdapterProviderProps {
  children: ReactNode;
}

export const WalletAdapterProvider: React.FC<WalletAdapterProviderProps> = ({ children }) => {
  // For now, just pass through the children since we're using the hook directly
  return (
    <WalletAdapterContext.Provider value={{}}>
      {children}
    </WalletAdapterContext.Provider>
  );
};
