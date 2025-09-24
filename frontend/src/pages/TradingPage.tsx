import React, { useState } from 'react';
import { useTradingData } from '../hooks/useTradingData';
import { apiService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const TradingPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [orderSize, setOrderSize] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { marketData, orderbook, positions, trades, isLoading, refetch } = useTradingData(selectedSymbol);
  
  // Handle marketData which can be single object or array
  const currentMarketData = Array.isArray(marketData) ? marketData[0] : marketData;
  const { toast } = useToast();

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (num: string | number, decimals: number = 2) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatDate = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleOpenPosition = async () => {
    if (!orderSize) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.openPosition(
        1, // strategyId
        selectedSymbol,
        orderSize,
        orderSide === 'BUY' ? 'LONG' : 'SHORT',
        10 // leverage
      );
      
      if (result.success) {
        toast({
          title: 'Position Opened',
          description: `${orderSide} ${orderSize} ${selectedSymbol}`,
        });
        setOrderSize('');
        refetch();
      } else {
        throw new Error(result.error || 'Failed to open position');
      }
    } catch (error: any) {
      toast({
        title: 'Position Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    setIsProcessing(true);
    try {
      const result = await apiService.closePosition(positionId, 1);
      
      if (result.success) {
        toast({
          title: 'Position Closed',
          description: 'Position closed successfully',
        });
        refetch();
      } else {
        throw new Error(result.error || 'Failed to close position');
      }
    } catch (error: any) {
      toast({
        title: 'Close Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderSize || (orderType === 'LIMIT' && !orderPrice)) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.routeOrder({
        symbol: selectedSymbol,
        side: orderSide,
        size: orderSize,
        price: orderPrice || '0',
        type: orderType,
      });
      
      if (result.success) {
        toast({
          title: 'Order Placed',
          description: `${orderSide} ${orderSize} ${selectedSymbol}`,
        });
        setOrderSize('');
        setOrderPrice('');
        refetch();
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMarketData ? formatCurrency(currentMarketData.price) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedSymbol}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMarketData ? (
                <span className={parseFloat(currentMarketData.change24h) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {parseFloat(currentMarketData.change24h) >= 0 ? '+' : ''}{formatNumber(currentMarketData.change24h)}%
                </span>
              ) : '0.00%'}
            </div>
            <p className="text-xs text-muted-foreground">
              24 hour change
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMarketData ? formatCurrency(currentMarketData.volume24h) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              24h volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funding Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMarketData ? formatNumber(currentMarketData.fundingRate, 4) : '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground">
              Perpetual funding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Book */}
        <Card>
          <CardHeader>
            <CardTitle>Order Book</CardTitle>
            <CardDescription>{selectedSymbol}</CardDescription>
          </CardHeader>
          <CardContent>
            {orderbook ? (
              <div className="space-y-2">
                {/* Asks */}
                <div className="space-y-1">
                  {orderbook.asks.slice(0, 5).map((ask, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-red-600">{formatCurrency(ask.price)}</span>
                      <span className="text-gray-500">{formatNumber(ask.size)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Spread */}
                <div className="border-t border-b py-2 text-center">
                  <span className="text-sm font-medium">
                    Spread: {orderbook.asks.length > 0 && orderbook.bids.length > 0 
                      ? formatCurrency(parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price))
                      : 'N/A'
                    }
                  </span>
                </div>
                
                {/* Bids */}
                <div className="space-y-1">
                  {orderbook.bids.slice(0, 5).map((bid, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-600">{formatCurrency(bid.price)}</span>
                      <span className="text-gray-500">{formatNumber(bid.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No order book data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Place Order</CardTitle>
            <CardDescription>Trade {selectedSymbol}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC-USD">BTC-USD</SelectItem>
                  <SelectItem value="ETH-USD">ETH-USD</SelectItem>
                  <SelectItem value="SOL-USD">SOL-USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select value={orderSide} onValueChange={(value: 'BUY' | 'SELL') => setOrderSide(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={orderType} onValueChange={(value: 'MARKET' | 'LIMIT') => setOrderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                placeholder="0.00"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
              />
            </div>

            {orderType === 'LIMIT' && (
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                />
              </div>
            )}

            <Button 
              onClick={handlePlaceOrder} 
              disabled={!orderSize || (orderType === 'LIMIT' && !orderPrice) || isProcessing}
              className="w-full"
              variant={orderSide === 'BUY' ? 'default' : 'destructive'}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {orderSide === 'BUY' ? <ArrowUp className="w-4 h-4 mr-2" /> : <ArrowDown className="w-4 h-4 mr-2" />}
                  {orderSide} {orderType}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <CardDescription>Your active positions</CardDescription>
          </CardHeader>
          <CardContent>
            {positions && positions.length > 0 ? (
              <div className="space-y-4">
                {positions.map((position: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                        {position.side?.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {position.size} @ {formatCurrency(position.entryPx || '0')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${parseFloat(position.unrealizedPnl || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPnl || '0')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClosePosition(position.positionId || index.toString())}
                        disabled={isProcessing}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No active positions
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      {trades && trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your trading history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trades.slice(0, 10).map((trade: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant={trade.direction === 'LONG' ? 'default' : 'destructive'}>
                      {trade.direction}
                    </Badge>
                    <div>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(trade.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatNumber(trade.size)} @ {formatCurrency(trade.entryPrice || '0')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {trade.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TradingPage;