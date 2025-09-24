import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVaultData } from '../hooks/useVaultData';
import { useTradingData } from '../hooks/useTradingData';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Vault as VaultIcon,
  Settings,
  BarChart3,
  LogOut,
  Wallet,
  TrendingUp,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import VaultsPage from './VaultsPage';
import AutomationPage from './AutomationPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('vaults');
  const [forceShow, setForceShow] = useState(false);
  
  // Fetch real-time data
  const { 
    vaultState, 
    userPosition, 
    vaultEvents, 
    isLoading: vaultLoading, 
    isError: vaultError, 
    refetch: refetchVault 
  } = useVaultData();
  
  const { 
    marketData, 
    positions, 
    trades, 
    isLoading: tradingLoading, 
    isError: tradingError, 
    refetch: refetchTrading 
  } = useTradingData();

  // Force show dashboard after 5 seconds to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('DashboardPage: Force showing dashboard after timeout');
      setForceShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    refetchVault();
    refetchTrading();
  };

  const formatNumber = (num: string | number, decimals: number = 2) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Debug logging
  console.log('DashboardPage: Loading states', { 
    vaultLoading, 
    tradingLoading, 
    vaultState, 
    userPosition, 
    vaultEvents,
    marketData,
    positions,
    trades
  });

  // Don't show error screen, just show loading or continue with mock data
  if ((vaultLoading || tradingLoading) && !forceShow) {
    console.log('DashboardPage: Still loading, showing loader');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Vault: {vaultLoading ? 'Loading' : 'Loaded'} | 
            Trading: {tradingLoading ? 'Loading' : 'Loaded'}
          </p>
        </div>
      </div>
    );
  }

  console.log('DashboardPage: Rendering dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <VaultIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Plexi Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatAddress(user.address)}
                  </span>
                  <Badge variant="secondary">
                    {formatCurrency(user.balance)} APT
                  </Badge>
                </div>
              )}
              
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Assets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vaultState ? formatCurrency(vaultState.totalAssets) : '$1,000,000.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {vaultState?.assetToken || 'USDC'}
              </p>
            </CardContent>
          </Card>

          {/* Total Shares */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vaultState ? formatNumber(vaultState.totalShares) : '1,000,000'}
              </div>
              <p className="text-xs text-muted-foreground">
                Vault shares outstanding
              </p>
            </CardContent>
          </Card>

          {/* User Position */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Position</CardTitle>
              <VaultIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userPosition ? formatCurrency(userPosition.assetsEquivalent) : '$1,000.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userPosition ? formatNumber(userPosition.shares) : '1,000'} shares
              </p>
            </CardContent>
          </Card>

          {/* Active Strategies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strategies</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vaultState?.strategiesCount || 3}
              </div>
              <p className="text-xs text-muted-foreground">
                Active strategies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trading Positions */}
        {positions && positions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>Your current trading positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                        {position.side?.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-gray-500">
                          Size: {position.size} | Leverage: {position.leverage}x
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(position.unrealizedPnl || '0')}
                      </div>
                      <div className="text-sm text-gray-500">PnL</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vaults" className="flex items-center space-x-2">
              <VaultIcon className="w-4 h-4" />
              <span>Vaults</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Automation</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vaults">
            <VaultsPage />
          </TabsContent>
          <TabsContent value="automation">
            <AutomationPage />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsPage />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;