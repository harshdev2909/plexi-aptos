import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch user vault state for analytics
  const { data: userVaultState, isLoading: userVaultLoading } = useQuery({
    queryKey: ['userVaultState', user?.address],
    queryFn: () => apiService.getUserVaultState(user?.address || ''),
    enabled: !!user?.address,
  });

  // Fetch positions for P&L analysis
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['positions', user?.address],
    queryFn: () => apiService.getHyperliquidPositions(user?.address),
    enabled: !!user?.address,
  });

  // Fetch vault events for activity analysis
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['vaultEvents'],
    queryFn: () => apiService.getVaultEvents(50),
  });

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate total P&L from positions
  const totalPnL = positions?.reduce((sum: number, position: any) => {
    return sum + parseFloat(position.unrealizedPnl || 0);
  }, 0) || 0;

  // Calculate win rate
  const profitablePositions = positions?.filter((position: any) => 
    parseFloat(position.unrealizedPnl || 0) > 0
  ).length || 0;
  const totalPositions = positions?.length || 0;
  const winRate = totalPositions > 0 ? (profitablePositions / totalPositions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${formatNumber(totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              All positions combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {profitablePositions}/{totalPositions} profitable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vault Balance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userVaultLoading ? '...' : formatNumber(userVaultState?.assetsEquivalent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {userVaultLoading ? '...' : formatNumber(userVaultState?.userShares || 0)} shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userVaultLoading ? '...' : formatNumber(userVaultState?.pendingRewards || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to claim
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Position Analysis</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your trading positions</CardDescription>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="text-center py-4">Loading positions...</div>
              ) : positions && positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Leverage</TableHead>
                      <TableHead>PnL</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{position.coin}-USD</TableCell>
                        <TableCell>
                          <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                            {position.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{position.szi}</TableCell>
                        <TableCell>${position.entryPx}</TableCell>
                        <TableCell>${position.entryPx}</TableCell>
                        <TableCell>{position.leverage}x</TableCell>
                        <TableCell className={position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${formatNumber(position.unrealizedPnl)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {position.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No positions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent vault and trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-4">Loading activity...</div>
              ) : events && events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">
                            {event.eventType.replace('Event', '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.payload?.amount ? `$${formatNumber(event.payload.amount)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {event.payload?.user ? formatAddress(event.payload.user) : '-'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">
                            {event.txHash ? formatAddress(event.txHash) : '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(event.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No activity found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Performance</CardTitle>
                <CardDescription>Performance by strategy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hyperliquid Hedge</span>
                    <Badge variant="default">+2.3%</Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-gray-500">30% allocation</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">TAPP Farming</span>
                    <Badge variant="default">+1.2%</Badge>
                  </div>
                  <Progress value={35} className="h-2" />
                  <p className="text-xs text-gray-500">70% allocation</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Current risk exposure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Exposure</span>
                    <span className="text-sm font-bold">$1,250</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  <p className="text-xs text-gray-500">25% of vault</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Max Drawdown</span>
                    <span className="text-sm font-bold text-red-600">-5.2%</span>
                  </div>
                  <Progress value={52} className="h-2" />
                  <p className="text-xs text-gray-500">Current: -2.1%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Chart</CardTitle>
              <CardDescription>P&L over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="w-12 h-12" />
                <span className="ml-2">Performance chart coming soon</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
