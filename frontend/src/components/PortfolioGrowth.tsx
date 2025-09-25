import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useUserPosition, useVaultState } from '@/hooks/useVaultData';
import { useAuth } from '@/contexts/AuthContext';

interface PortfolioDataPoint {
  date: string;
  value: number;
  growth: number;
}

interface PortfolioGrowthProps {
  className?: string;
  userPosition?: any;
}

export function PortfolioGrowth({ className, userPosition }: PortfolioGrowthProps) {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Use real API data
  const { user } = useAuth();
  const { data: realUserPosition, isLoading: userLoading } = useUserPosition();
  const { data: vaultState, isLoading: stateLoading } = useVaultState();
  
  const isLoading = userLoading || stateLoading;

  // Calculate portfolio growth from real transaction history
  const calculatePortfolioGrowth = (position: any, txHistory: any[]) => {
    if (!position || !txHistory || txHistory.length === 0) {
      // No transaction history, create single point with current value
      const currentValue = parseFloat(position?.assetsEquivalent || '0');
      return [{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentValue,
        deposit: currentValue
      }];
    }

    // Sort transactions by date (oldest first)
    const sortedTxs = [...txHistory].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let runningValue = 0;
    const growthData: any[] = [];
    
    // Calculate cumulative value from transactions
    sortedTxs.forEach((tx) => {
      const amount = parseFloat(tx.amount || '0');
      
      if (tx.type === 'deposit') {
        runningValue += amount;
      } else if (tx.type === 'withdraw') {
        runningValue = Math.max(0, runningValue - amount);
      }
      
      const txDate = new Date(tx.createdAt);
      growthData.push({
        date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: runningValue,
        deposit: runningValue
      });
    });
    
    // Add current position as the latest point
    const currentValue = parseFloat(position.assetsEquivalent || '0');
    if (currentValue > 0) {
      growthData.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentValue,
        deposit: currentValue
      });
    }
    
    return growthData.slice(-7); // Return last 7 days
  };

  useEffect(() => {
    if (!isLoading && (realUserPosition || userPosition)) {
      const position = realUserPosition || userPosition;
      const txHistory = position?.txHistory || [];
      
      const calculatedChartData = calculatePortfolioGrowth(position, txHistory);
      setChartData(calculatedChartData);
      
      // Calculate portfolio data from real position
      const currentValue = parseFloat(position?.assetsEquivalent || '0');
      const userShares = parseFloat(position?.shares || '0');
      // Calculate share price from vault state
      const totalAssets = parseFloat(vaultState?.totalAssets || '0');
      const totalShares = parseFloat(vaultState?.totalShares || '0');
      const sharePrice = totalShares > 0 ? totalAssets / totalShares : 1;
      
      // Calculate initial deposit from transaction history
      const deposits = txHistory.filter((tx: any) => tx.type === 'deposit');
      const withdrawals = txHistory.filter((tx: any) => tx.type === 'withdraw');
      const totalDeposits = deposits.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0);
      const totalWithdrawals = withdrawals.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount || '0'), 0);
      const initialDeposit = Math.max(0, totalDeposits - totalWithdrawals);
      
      const totalGain = currentValue - initialDeposit;
      const totalGainPercent = initialDeposit > 0 ? ((totalGain / initialDeposit) * 100) : 0;
      
      setPortfolioData({
        initialDeposit,
        currentValue,
        shares: userShares,
        sharePrice,
        totalGain,
        totalGainPercent
      });
    }
  }, [realUserPosition, userPosition, vaultState, isLoading]);

  const isPositive = portfolioData?.totalGainPercent >= 0;
  const hasInvestments = portfolioData?.initialDeposit > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <DollarSign className="h-5 w-5" />
          Portfolio Growth
        </CardTitle>
        <CardDescription className="text-gray-600">Your investment performance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
          </div>
        ) : !hasInvestments ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {/* Coming Soon Glimpse */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">Coming Soon</span>
              </div>
              <p className="text-xs text-blue-600">
                Advanced portfolio analytics, yield tracking, and performance insights
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Value */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                ${portfolioData.currentValue.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className="text-sm text-gray-500">Current Value</div>
            </div>

            {/* Portfolio Growth Chart */}
            {chartData.length > 0 && (
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#666' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}`, 'Value']}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#portfolioGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gain/Loss */}
            <div className="flex items-center justify-center space-x-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <div className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}${portfolioData.totalGain.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <Badge variant={isPositive ? 'default' : 'destructive'} className="bg-green-100 text-green-800">
                <Percent className="h-3 w-3 mr-1" />
                {isPositive ? '+' : ''}{portfolioData.totalGainPercent.toFixed(2)}%
              </Badge>
            </div>

            {/* Portfolio Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  ${portfolioData.initialDeposit.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-xs text-gray-500">Initial Deposit</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {portfolioData.shares.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-xs text-gray-500">Vault Shares</div>
              </div>
            </div>

            {/* Share Price */}
            <div className="text-center pt-2">
              <div className="text-sm text-gray-500">
                Share Price: ${portfolioData.sharePrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 6, 
                  maximumFractionDigits: 6 
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
