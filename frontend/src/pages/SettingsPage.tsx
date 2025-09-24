import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Settings, Shield, Bell, Globe, Key, Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Trading settings
    defaultLeverage: 10,
    maxPositionSize: 10000,
    slippageTolerance: 0.5,
    autoCloseOnLoss: true,
    autoCloseOnProfit: true,
    
    // Risk management
    stopLossPercent: 5,
    takeProfitPercent: 10,
    maxDrawdown: 20,
    hedgingThreshold: 5,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    priceAlerts: true,
    positionAlerts: true,
    
    // API settings
    apiKey: '',
    webhookUrl: '',
    rateLimit: 100,
    
    // Display settings
    theme: 'light',
    currency: 'USD',
    timezone: 'UTC',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      defaultLeverage: 10,
      maxPositionSize: 10000,
      slippageTolerance: 0.5,
      autoCloseOnLoss: true,
      autoCloseOnProfit: true,
      stopLossPercent: 5,
      takeProfitPercent: 10,
      maxDrawdown: 20,
      hedgingThreshold: 5,
      emailNotifications: true,
      pushNotifications: false,
      priceAlerts: true,
      positionAlerts: true,
      apiKey: '',
      webhookUrl: '',
      rateLimit: 100,
      theme: 'light',
      currency: 'USD',
      timezone: 'UTC',
    });
    
    toast({
      title: 'Reset',
      description: 'Settings reset to defaults',
    });
  };

  return (
    <div className="space-y-6">
      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Trading Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your trading preferences and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Leverage: {settings.defaultLeverage}x</Label>
                <Slider
                  value={[settings.defaultLeverage]}
                  onValueChange={(value) => setSettings({ ...settings, defaultLeverage: value[0] })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPositionSize">Max Position Size (USDC)</Label>
                <Input
                  id="maxPositionSize"
                  type="number"
                  value={settings.maxPositionSize}
                  onChange={(e) => setSettings({ ...settings, maxPositionSize: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Slippage Tolerance: {settings.slippageTolerance}%</Label>
                <Slider
                  value={[settings.slippageTolerance]}
                  onValueChange={(value) => setSettings({ ...settings, slippageTolerance: value[0] })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Close on Loss</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically close positions when stop loss is hit
                  </p>
                </div>
                <Switch
                  checked={settings.autoCloseOnLoss}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoCloseOnLoss: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Close on Profit</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically close positions when take profit is hit
                  </p>
                </div>
                <Switch
                  checked={settings.autoCloseOnProfit}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoCloseOnProfit: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Risk Management</span>
          </CardTitle>
          <CardDescription>
            Set risk parameters to protect your capital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Stop Loss: {settings.stopLossPercent}%</Label>
                <Slider
                  value={[settings.stopLossPercent]}
                  onValueChange={(value) => setSettings({ ...settings, stopLossPercent: value[0] })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Take Profit: {settings.takeProfitPercent}%</Label>
                <Slider
                  value={[settings.takeProfitPercent]}
                  onValueChange={(value) => setSettings({ ...settings, takeProfitPercent: value[0] })}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Max Drawdown: {settings.maxDrawdown}%</Label>
                <Slider
                  value={[settings.maxDrawdown]}
                  onValueChange={(value) => setSettings({ ...settings, maxDrawdown: value[0] })}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Hedging Threshold: {settings.hedgingThreshold}%</Label>
                <Slider
                  value={[settings.hedgingThreshold]}
                  onValueChange={(value) => setSettings({ ...settings, hedgingThreshold: value[0] })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified about important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of significant price movements
                  </p>
                </div>
                <Switch
                  checked={settings.priceAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, priceAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Position Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about position changes
                  </p>
                </div>
                <Switch
                  checked={settings.positionAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, positionAlerts: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Settings</span>
          </CardTitle>
          <CardDescription>
            Configure API access and webhooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-webhook-url.com"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate Limit: {settings.rateLimit} requests/minute</Label>
              <Slider
                value={[settings.rateLimit]}
                onValueChange={(value) => setSettings({ ...settings, rateLimit: value[0] })}
                max={1000}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Display Settings</span>
          </CardTitle>
          <CardDescription>
            Customize your interface preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
