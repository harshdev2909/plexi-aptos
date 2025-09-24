import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '../hooks/use-toast';
import { api } from '../services/api';

interface Position {
  positionId: string;
  symbol: string;
  size: string;
  direction: string;
  entryPrice: string;
  leverage: number;
  pnl: string;
  timestamp: number;
}

interface HyperliquidPositionsProps {
  userAddress: string;
  onPositionUpdate?: () => void;
}

export const HyperliquidPositions: React.FC<HyperliquidPositionsProps> = ({
  userAddress,
  onPositionUpdate,
}) => {
  const [symbol, setSymbol] = useState<string>('BTC-USD');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState<number>(0.1);
  const [leverage, setLeverage] = useState<number>(10);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const { toast } = useToast();

  const handleOpenPosition = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/hyperliquid/position/open', {
        symbol,
        side,
        size,
        leverage,
        userAddress,
      });

      if (response.data.success) {
        toast({
          title: 'Position Opened',
          description: `${side.toUpperCase()} ${size} ${symbol} with ${leverage}x leverage`,
        });
        onPositionUpdate?.();
        loadPositions();
      } else {
        throw new Error(response.data.error || 'Failed to open position');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/hyperliquid/position/close', {
        positionId,
      });

      if (response.data.success) {
        toast({
          title: 'Position Closed',
          description: `Position ${positionId} has been closed`,
        });
        onPositionUpdate?.();
        loadPositions();
      } else {
        throw new Error(response.data.error || 'Failed to close position');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      setIsLoadingPositions(true);
      const response = await api.get(`/hyperliquid/positions/${userAddress}`);
      
      if (response.data.success) {
        setPositions(response.data.data.positions || []);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  React.useEffect(() => {
    loadPositions();
  }, [userAddress]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Open Position</CardTitle>
          <CardDescription>
            Open a new position on Hyperliquid testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
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
              <Select value={side} onValueChange={(value: 'long' | 'short') => setSide(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                step="0.001"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                placeholder="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leverage">Leverage</Label>
              <Input
                id="leverage"
                type="number"
                min="1"
                max="100"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                placeholder="10"
              />
            </div>
          </div>

          <Button
            onClick={handleOpenPosition}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Opening Position...' : 'Open Position'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>
            Your current positions on Hyperliquid testnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPositions ? (
            <div className="text-center py-4">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No active positions
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.positionId}>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        position.direction === 'LONG' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {position.direction}
                      </span>
                    </TableCell>
                    <TableCell>{position.size}</TableCell>
                    <TableCell>${position.entryPrice}</TableCell>
                    <TableCell>{position.leverage}x</TableCell>
                    <TableCell className={parseFloat(position.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${position.pnl}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClosePosition(position.positionId)}
                        disabled={isLoading}
                      >
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
