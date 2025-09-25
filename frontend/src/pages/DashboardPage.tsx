/**
 * @fileoverview Main dashboard page component for the Plexi Vault application.
 * Provides vault overview, user position tracking, and transaction management.
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TVLChart } from '@/components/TVLChart';
import { PortfolioGrowth } from '@/components/PortfolioGrowth';
import { RecentActivity } from '@/components/RecentActivity';
import { DepositModal } from '@/components/modals/DepositModal';
import { WithdrawModal } from '@/components/modals/WithdrawModal';
import { TestSidebar } from '@/components/TestSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStore } from '@/store/useVaultStore';
import { usePetraWallet } from '@/hooks/usePetraWallet';
import { priceService, PriceData } from '@/services/priceService';
import {
  TrendingUp,
  Wallet,
  Shield,
  Target,
  Coins,
  Zap,
  Activity,
  History,
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aptPrice, setAptPrice] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  /**
   * Handle URL-based tab navigation
   * Updates active tab based on current route
   */
  useEffect(() => {
    if (location.pathname === '/dashboard/history') {
      setActiveTab('history');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  /**
   * Handle tab changes and update URL accordingly
   * @param {string} value - The tab value to switch to
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history') {
      navigate('/dashboard/history', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // Authentication and data hooks
  const { isAuthenticated, isLoading: authLoading, user, login, logout } = useAuth();
  const { vaultState, userPosition, vaultEvents, isLoading: vaultLoading, refetch } = useVaultData();
  const { stats, isLoading: storeLoading, updateStats } = useVaultStore();
  const {
    isConnected,
    address,
    balance,
    isLoading: walletLoading,
    connect,
    disconnect
  } = usePetraWallet();
  
  /**
   * Fetch APT price on component mount and set up periodic refresh
   */
  useEffect(() => {
    const fetchAptPrice = async () => {
      try {
        setPriceLoading(true);
        const priceData = await priceService.getAptPrice();
        setAptPrice(priceData);
      } catch (error) {
        console.error('Failed to fetch APT price:', error);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchAptPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchAptPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Format numeric value as currency (USD)
   * @param {number|string} value - The value to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    // Handle NaN/invalid values
    if (isNaN(num) || !isFinite(num)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  /**
   * Format numeric value with proper decimal places
   * @param {number|string} value - The value to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    // Handle NaN/invalid values
    if (isNaN(num) || !isFinite(num)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  /**
   * Handle refresh of all cached data
   * Clears API cache and refetches all vault data
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Import and clear API cache properly
      const { apiCache } = await import('../utils/cache');
      apiCache.clear();


      // Refetch all data
      await Promise.all([
        refetch(), // Refetch vault data
        updateStats(), // Update vault store stats
      ]);

      // Small delay to show the refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle wallet connection/disconnection
   * Manages wallet state and user authentication
   */
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

  // Calculate derived data from API responses with safe number handling
  const totalAssets = parseFloat(vaultState?.totalAssets || '0') || stats.tvl || 0;
  const totalShares = parseFloat(vaultState?.totalShares || '0') || 0;
  const userShares = parseFloat(userPosition?.shares || '0') || stats.userShares || 0;
  const userBalance = parseFloat(userPosition?.assetsEquivalent || '0') || stats.userBalance || balance || 0;
  
  // Ensure all values are valid numbers to prevent NaN display issues
  const safeValues = {
    totalAssets: isNaN(totalAssets) ? 0 : totalAssets,
    totalShares: isNaN(totalShares) ? 0 : totalShares,
    userShares: isNaN(userShares) ? 0 : userShares,
    userBalance: isNaN(userBalance) ? 0 : userBalance
  };
  
  /**
   * Calculate hedge ratio for the vault strategy
   * @returns {number} The hedge ratio percentage (currently fixed at 50%)
   */
  const calculateHedgeRatio = () => {
    // Always return 100% hedge ratio as requested
    return 50;
  };
  
  const hedgeRatio = calculateHedgeRatio();
  
  /**
   * Calculate strategy invested amount from vault state
   * @returns {number} The amount of assets deployed in strategies (equals total assets)
   */
  const calculateStrategyInvested = () => {
    // Strategy invested should equal total assets (100% deployment)
    return safeValues.totalAssets;
  };
  
  const strategyInvested = calculateStrategyInvested();
  
  /**
   * Calculate estimated USD value of user's MST shares
   * Conversion: MST shares → APT → USD
   * @returns {number} Estimated USD value
   */
  const calculateEstimatedValue = () => {
    try {
      // Convert MST shares to APT (100 MST = 1 APT)
      const aptAmount = safeValues.userShares / 100;
      
      // Get APT price in USD from price service
      const currentAptPrice = aptPrice?.price || 8.50; // Fallback to $8.50 if price not loaded
      
      // Calculate USD value
      const usdValue = aptAmount * currentAptPrice;
      
      return isNaN(usdValue) ? 0 : usdValue;
    } catch (error) {
      console.error('Error calculating estimated value:', error);
      // Fallback calculation with default APT price
      const aptAmount = safeValues.userShares / 100;
      return aptAmount * 8.50; // Default $8.50 per APT
    }
  };
  
  const estimatedValue = calculateEstimatedValue();
  
  /**
   * Get the current APY for the Plexi Vault
   * @returns {string} Fixed APY percentage as string
   */
  const calculateAPY = () => {
    return "7.0";
  };
  
  const currentAPY = calculateAPY();

  const isLoading = authLoading || vaultLoading || storeLoading || walletLoading || priceLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Testnet Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              🚀 Live on Aptos Testnet! 
            </span>
            <Badge variant="outline" className="text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-600">
              Mainnet wen?
            </Badge>
          </div>
        </div>
      </div>


      {/* Sidebar */}
      <TestSidebar />


      {/* Main Content */}
      <div className="ml-64 relative">
        {/* Top Bar */}
        <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6 relative z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          
          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleWalletConnect}
              disabled={isLoading}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-balance">Plexi Vault</h1>
                    <p className="text-muted-foreground">Composable Perp + Yield Strategy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">MST</Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200 text-sm px-3 py-1">
                    {currentAPY}% APY
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 text-sm px-3 py-1">
                    Aptos Testnet
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.open('https://aptos.dev/network/faucet', '_blank')} 
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Coins className="h-4 w-4" />
                  Get Test APT
                </Button>
                <Button 
                  onClick={() => setShowDepositModal(true)} 
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Deposit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* User Balance Section */}
            {isConnected && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Your Position
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </CardTitle>
                  <CardDescription>Your current vault position and balances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Vault Shares</p>
                      <p className="text-3xl font-bold">{formatNumber(safeValues.userShares)}</p>
                      <p className="text-xs text-muted-foreground">MST tokens</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(estimatedValue)}</p>
                      <p className="text-xs text-muted-foreground">USD equivalent</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">APT Balance</p>
                      <p className="text-3xl font-bold">{formatNumber(balance)} APT</p>
                      <p className="text-xs text-muted-foreground">Available to deposit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Vault Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assets (TVL)</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(safeValues.totalAssets)} APT</div>
                  <p className="text-xs text-muted-foreground mt-1">Total APT locked in the vault</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(safeValues.totalShares)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total vault shares outstanding</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Strategy Invested</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(strategyInvested)} APT</div>
                  <p className="text-xs text-muted-foreground mt-1">APT deployed in strategy</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hedge Ratio</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{hedgeRatio}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Current hedging percentage</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
              <TVLChart vaultEvents={vaultEvents} totalAssets={totalAssets} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PortfolioGrowth userPosition={userPosition} />
                <RecentActivity vaultEvents={vaultEvents} truncateHashes={true} showFullHistory={false} />
              </div>
            </div>

            {/* Strategy Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Strategy Overview
                </CardTitle>
                <CardDescription>Composable perpetual and yield farming strategy with dynamic hedging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Current APY</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{currentAPY}%</p>
                    <p className="text-xs text-muted-foreground">Estimated annual yield</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Strategy Utilization</span>
                    </div>
                    <p className="text-2xl font-bold">
                      100%
                    </p>
                    <p className="text-xs text-muted-foreground">Assets actively deployed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-lg px-3 py-1">
                      Moderate
                    </Badge>
                    <p className="text-xs text-muted-foreground">Balanced risk/reward</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Addresses */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Contract Addresses
                </CardTitle>
                <CardDescription>View contracts on Aptos Explorer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Vault</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href="https://explorer.aptoslabs.com/account/0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2?network=testnet" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">APT</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        0x1::aptos_coin::AptosCoin
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href="https://explorer.aptoslabs.com/account/0x1?network=testnet" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Prompt */}
            {!isConnected && (
              <Card className="border-dashed border-2 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-primary/10 rounded-full mb-6">
                    <Wallet className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Connect Your Wallet</h3>
                  <p className="text-muted-foreground text-center mb-8 max-w-md">
                    Connect your wallet to deposit, withdraw, and view your position in the Plexi Vault
                  </p>
                  <Button size="lg" className="px-8" onClick={handleWalletConnect} disabled={isLoading}>
                    <Wallet className="mr-2 h-5 w-5" />
                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    <History className="h-6 w-6" />
                    Transaction History
                  </h2>
                  <p className="text-muted-foreground">Your deposit and withdrawal history</p>
                </div>

                <RecentActivity truncateHashes={false} showFullHistory={true} />
              </div>
            </TabsContent>

          </Tabs>

          {/* Modals */}
          <DepositModal open={showDepositModal} onOpenChange={setShowDepositModal} />
          <WithdrawModal open={showWithdrawModal} onOpenChange={setShowWithdrawModal} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
