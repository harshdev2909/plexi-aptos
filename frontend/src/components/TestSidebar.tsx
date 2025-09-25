import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  History, 
  ExternalLink,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePetraWallet } from '@/hooks/usePetraWallet';

interface TestSidebarProps {
  className?: string;
}

export const TestSidebar: React.FC<TestSidebarProps> = ({ className }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const {
    isConnected,
    address,
    isLoading: walletLoading,
    connect,
    disconnect
  } = usePetraWallet();

  const isLoading = authLoading || walletLoading;

  // Handle wallet connection
  const handleWalletConnect = async () => {
    try {
      if (isConnected) {
        await disconnect();
        logout();
      } else {
        await connect();
        await login();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  return (
    <div className={`fixed left-0 top-0 w-64 h-screen bg-card border-r border-border flex flex-col z-50 ${className}`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">Plexi</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/dashboard">
          <Button
            variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 h-12 ${
              location.pathname === '/dashboard' 
                ? 'bg-secondary shadow-sm' 
                : ''
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Button>
        </Link>
        <Link to="/dashboard/history">
          <Button
            variant={location.pathname === '/dashboard/history' ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 h-12 ${
              location.pathname === '/dashboard/history' 
                ? 'bg-secondary shadow-sm' 
                : ''
            }`}
          >
            <History className="h-5 w-5" />
            <span className="font-medium">History</span>
          </Button>
        </Link>
      </nav>

      {/* Wallet Section */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleWalletConnect}
          disabled={isLoading}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isLoading ? 'Loading...' : isConnected ? 'Disconnect' : 'Connect Wallet'}
        </Button>
        {isConnected && address && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
};
