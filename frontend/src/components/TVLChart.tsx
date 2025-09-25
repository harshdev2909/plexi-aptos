/**
 * @fileoverview TVL (Total Value Locked) Chart component for displaying vault growth over time.
 * Shows historical TVL data with interactive charts and growth metrics.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useVaultEvents, useVaultState } from '@/hooks/useVaultData';

/**
 * Represents a single data point in the TVL chart
 */
interface TVLDataPoint {
  timestamp: string;
  tvl: number;
  date: string;
}

/**
 * Props for the TVLChart component
 */
interface TVLChartProps {
  className?: string;
  vaultEvents?: any[];
  totalAssets?: number;
}

/**
 * TVL Chart component that displays vault growth over time
 * @param {TVLChartProps} props - Component props
 * @returns {JSX.Element} The rendered TVL chart
 */
export function TVLChart({ className, vaultEvents, totalAssets }: TVLChartProps) {
  const [tvlData, setTvlData] = useState<TVLDataPoint[]>([]);
  const [currentTVL, setCurrentTVL] = useState(0);
  
  // Fetch real API data for vault events and state
  const { data: realVaultEvents, isLoading: eventsLoading } = useVaultEvents(50);
  const { data: vaultState, isLoading: stateLoading } = useVaultState();
  
  const isLoading = eventsLoading || stateLoading;

  /**
   * Calculate TVL history from vault events
   * @param {any[]} events - Array of vault events
   * @param {number} currentTotalAssets - Current total assets in vault
   * @returns {TVLDataPoint[]} Array of TVL data points
   */
  const calculateTVLHistory = (events: any[], currentTotalAssets: number) => {
    if (!events || events.length === 0) {
      // If no events, create a single data point with current TVL
      return [{
        timestamp: new Date().toISOString(),
        tvl: currentTotalAssets || 0,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }];
    }

    // Sort events by date (oldest first)
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let runningTVL = 0;
    const tvlHistory: TVLDataPoint[] = [];
    
    // Calculate cumulative TVL from events (net deposits)
    sortedEvents.forEach((event, index) => {
      const amount = parseFloat(event.payload?.amount || '0');
      
      if (event.eventType === 'DepositEvent') {
        runningTVL += amount;
      } else if (event.eventType === 'WithdrawEvent') {
        runningTVL = Math.max(0, runningTVL - amount);
      }
      
      const eventDate = new Date(event.createdAt);
      tvlHistory.push({
        timestamp: event.createdAt,
        tvl: runningTVL,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    });
    
    // Use the calculated running TVL as current if we don't have real vault assets
    // This handles the case where vault state shows 0 but we have transaction history
    const finalTVL = currentTotalAssets > 0 ? currentTotalAssets : runningTVL;
    
    // Add current state as the latest point
    if (tvlHistory.length === 0 || finalTVL !== tvlHistory[tvlHistory.length - 1].tvl) {
      tvlHistory.push({
        timestamp: new Date().toISOString(),
        tvl: finalTVL,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    // If we have less than 7 days of data, pad with zeros or earliest value
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (tvlHistory.length > 0 && new Date(tvlHistory[0].timestamp) > sevenDaysAgo) {
      const earliestTVL = 0; // Start from 0 for better visualization
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        if (date < new Date(tvlHistory[0].timestamp)) {
          tvlHistory.unshift({
            timestamp: date.toISOString(),
            tvl: earliestTVL,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      }
    }
    
    return tvlHistory.slice(-7); // Return last 7 days
  };

  useEffect(() => {
    if (!isLoading) {
      try {
        const currentAssets = parseFloat(vaultState?.totalAssets || totalAssets?.toString() || '0');
        const eventsToUse = realVaultEvents || vaultEvents || [];
        
        const calculatedTVLData = calculateTVLHistory(eventsToUse, currentAssets);
        setTvlData(calculatedTVLData);
        
        // Use the last calculated TVL value as current TVL
        const latestTVL = calculatedTVLData[calculatedTVLData.length - 1]?.tvl || 0;
        setCurrentTVL(latestTVL);
        
      } catch (error) {
        console.error('Error calculating TVL data:', error);
        // Fallback to basic data
        const fallbackTVL = parseFloat(totalAssets?.toString() || '0');
        setTvlData([{
          timestamp: new Date().toISOString(),
          tvl: fallbackTVL,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }]);
        setCurrentTVL(fallbackTVL);
      }
    }
  }, [realVaultEvents, vaultState, vaultEvents, totalAssets, isLoading]);

  /**
   * Calculate growth percentage between latest and previous data points
   * @returns {number} Growth percentage
   */
  const calculateGrowth = () => {
    if (tvlData.length < 2) return 0;
    const latest = tvlData[tvlData.length - 1].tvl;
    const previous = tvlData[tvlData.length - 2].tvl;
    return ((latest - previous) / previous) * 100;
  };

  const growth = calculateGrowth();
  const isPositiveGrowth = growth >= 0;

  /**
   * Custom tooltip component for the chart
   * @param {any} props - Tooltip props from Recharts
   * @returns {JSX.Element|null} Rendered tooltip or null
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-purple-600">
            TVL: {payload[0].value.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} APT
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-gray-900">TVL Growth</CardTitle>
          <CardDescription className="text-gray-600">Total Value Locked over time</CardDescription>
        </div>
        <Activity className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current TVL and Growth */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentTVL.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} APT
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <TrendingUp className={`h-3 w-3 ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={isPositiveGrowth ? 'text-green-500' : 'text-red-500'}>
                    {isPositiveGrowth ? '+' : ''}{growth.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs yesterday</span>
                </div>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Last 7 days</div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tvlData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                      tickFormatter={(value) => `${value.toFixed(1)} APT`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="tvl" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {Math.max(...tvlData.map(p => p.tvl)).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} APT
                </div>
                <div className="text-xs text-gray-500">Peak TVL</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {tvlData.length > 0 ? tvlData.length : 0}
                </div>
                <div className="text-xs text-gray-500">Data Points</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
