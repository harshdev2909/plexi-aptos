import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ArrowUpDown, ArrowDownUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { useVaultEvents } from '@/hooks/useVaultData';

interface ActivityItem {
  id: string;
  type: 'deposit' | 'withdraw' | 'emergency_withdraw';
  amount: string;
  shares?: string;
  user: string;
  timestamp: string;
  txHash: string;
}

interface RecentActivityProps {
  className?: string;
  vaultEvents?: any[];
  truncateHashes?: boolean; // New prop to control hash truncation
  showFullHistory?: boolean; // New prop to show more transactions
}

export function RecentActivity({ className, vaultEvents, truncateHashes = true, showFullHistory = false }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  // Use real API data - fetch more if showing full history
  const { data: realVaultEvents, isLoading } = useVaultEvents(showFullHistory ? 100 : 20);

  // Transform vault events to activity items
  const transformEventsToActivities = (events: any[]): ActivityItem[] => {
    if (!events || events.length === 0) return [];
    
    return events.map((event) => {
      let type: 'deposit' | 'withdraw' | 'emergency_withdraw' = 'deposit';
      if (event.eventType === 'WithdrawEvent') {
        type = 'withdraw';
      } else if (event.eventType === 'EmergencyWithdrawEvent') {
        type = 'emergency_withdraw';
      }
      
      return {
        id: event.id,
        type,
        amount: event.payload?.amount || '0',
        shares: event.payload?.shares || '0',
        user: event.payload?.user || 'Unknown',
        timestamp: event.createdAt,
        txHash: event.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000' // Fallback for missing hash
      };
    }).slice(0, showFullHistory ? 50 : 10); // Limit based on view type
  };

  useEffect(() => {
    if (!isLoading) {
      const eventsToUse = realVaultEvents || vaultEvents || [];
      const transformedActivities = transformEventsToActivities(eventsToUse);
      setActivities(transformedActivities);
    }
  }, [realVaultEvents, vaultEvents, isLoading]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpDown className="h-4 w-4 text-green-600" />;
      case 'withdraw':
        return <ArrowDownUp className="h-4 w-4 text-blue-600" />;
      case 'emergency_withdraw':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'withdraw':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'emergency_withdraw':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatAmount = (amount: string, shares?: string, type?: string) => {
    const numAmount = parseFloat(amount);
    const numShares = shares ? parseFloat(shares) : 0;

    if (type === 'withdraw' && numShares > 0) {
      // For withdrawals, show shares (MST tokens) and APT equivalent
      const aptEquivalent = numShares / 100; // 100 shares = 1 APT
      return `${numShares.toLocaleString()} MST (${aptEquivalent.toFixed(4)} APT)`;
    } else if (type === 'deposit' && numAmount > 0) {
      // For deposits, show APT amount and shares equivalent
      const sharesEquivalent = numAmount * 100; // 1 APT = 100 shares
      return `${numAmount.toFixed(4)} APT (${sharesEquivalent.toLocaleString()} MST)`;
    }

    // Fallback to APT display
    return `${numAmount.toFixed(4)} APT`;
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 10) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest vault transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest vault transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No recent activity</h3>
              <p className="text-gray-600">
                Recent transactions will appear here
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getTypeIcon(activity.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getTypeColor(activity.type)} text-xs font-medium`}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(activity.amount, activity.shares, activity.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">
                        {truncateHashes ? truncateHash(activity.txHash) : activity.txHash}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${activity.txHash}?network=testnet`, '_blank')}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    title={`View transaction: ${activity.txHash}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {activities.length > 0 && !showFullHistory && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              View All Activity
            </Button>
          </div>
        )}
        
        {/* Real data indicator */}
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500">
            {activities.length > 0 ? 'Live data from vault events' : 'No recent activity'} • Updates every minute
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
