import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { apiService } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { Settings, Shield, TrendingUp, AlertTriangle, Play, Pause } from 'lucide-react';

const AutomationPage: React.FC = () => {
  const { toast } = useToast();
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [hedgingThreshold, setHedgingThreshold] = useState([5]);
  const [stopLossPercent, setStopLossPercent] = useState([5]);
  const [takeProfitPercent, setTakeProfitPercent] = useState([10]);
  const [maxLeverage, setMaxLeverage] = useState([10]);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  const handleRebalance = async () => {
    try {
      setIsRebalancing(true);
      const result = await apiService.rebalance(30, 70); // 30% hedge, 70% farm
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Rebalance triggered successfully',
        });
      } else {
        throw new Error(result.error || 'Rebalance failed');
      }
    } catch (error: any) {
      toast({
        title: 'Rebalance Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleHarvest = async () => {
    try {
      setIsHarvesting(true);
      const result = await apiService.harvest(1); // Strategy ID 1
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Harvest triggered successfully',
        });
      } else {
        throw new Error(result.error || 'Harvest failed');
      }
    } catch (error: any) {
      toast({
        title: 'Harvest Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsHarvesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Automation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Automation Settings</span>
          </CardTitle>
          <CardDescription>
            Configure automated trading and risk management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation">Enable Automation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically manage positions and rebalancing
              </p>
            </div>
            <Switch
              id="automation"
              checked={isAutomationEnabled}
              onCheckedChange={setIsAutomationEnabled}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Risk Management</span>
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Hedging Threshold: {hedgingThreshold[0]}%</Label>
                  <Slider
                    value={hedgingThreshold}
                    onValueChange={setHedgingThreshold}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically hedge when exposure exceeds this threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Stop Loss: {stopLossPercent[0]}%</Label>
                  <Slider
                    value={stopLossPercent}
                    onValueChange={setStopLossPercent}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically close positions at this loss threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Take Profit: {takeProfitPercent[0]}%</Label>
                  <Slider
                    value={takeProfitPercent}
                    onValueChange={setTakeProfitPercent}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically close positions at this profit threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Leverage: {maxLeverage[0]}x</Label>
                  <Slider
                    value={maxLeverage}
                    onValueChange={setMaxLeverage}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum leverage allowed for new positions
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Strategy Management</span>
              </h4>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Hyperliquid Hedge</CardTitle>
                    <CardDescription className="text-xs">
                      Automated hedging strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allocation</span>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Risk Level</span>
                      <Badge variant="outline">Medium</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">TAPP Farming</CardTitle>
                    <CardDescription className="text-xs">
                      Yield farming strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allocation</span>
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Risk Level</span>
                      <Badge variant="outline">Low</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Manual Controls</span>
          </CardTitle>
          <CardDescription>
            Manually trigger vault operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleRebalance}
              disabled={isRebalancing}
              className="w-full"
              variant="outline"
            >
              {isRebalancing ? (
                <>
                  <Pause className="w-4 h-4 mr-2 animate-spin" />
                  Rebalancing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Trigger Rebalance
                </>
              )}
            </Button>

            <Button
              onClick={handleHarvest}
              disabled={isHarvesting}
              className="w-full"
              variant="outline"
            >
              {isHarvesting ? (
                <>
                  <Pause className="w-4 h-4 mr-2 animate-spin" />
                  Harvesting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Trigger Harvest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Status</CardTitle>
          <CardDescription>
            Current automation state and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">Active</div>
                <div className="text-sm text-gray-500">Automation Status</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-gray-500">Active Strategies</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">15</div>
                <div className="text-sm text-gray-500">Positions Managed</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Recent Automation Events</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Position hedged automatically</span>
                  </div>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Vault rebalanced</span>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Stop loss triggered</span>
                  </div>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationPage;
