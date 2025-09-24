import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Zap, Settings, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome to Plexi Admin Panel',
      });
    } else {
      toast({
        title: 'Access Denied',
        description: 'Invalid password',
        variant: 'destructive',
      });
    }
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    // Mock API delay
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: `${action} Triggered`,
        description: `Successfully executed ${action.toLowerCase()} operation.`,
      });
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="plexi-card text-center"
          >
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
            <p className="text-muted-foreground mb-6">
              Enter admin password to access vault controls
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="plexi-input mt-2"
                  placeholder="Enter admin password"
                />
              </div>
              <Button 
                onClick={handleAuth}
                className="w-full plexi-button-primary"
              >
                Access Admin Panel
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Demo password: admin123
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Control vault operations and strategy parameters
            </p>
          </div>
          <Button
            onClick={() => setIsAuthenticated(false)}
            variant="outline"
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            Logout
          </Button>
        </div>

        {/* Vault Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="plexi-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Vault Operations</span>
                </CardTitle>
                <CardDescription>
                  Manually trigger vault operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleAction('Rebalance')}
                  disabled={isLoading}
                  className="w-full plexi-button-primary"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Trigger Rebalance
                </Button>
                <Button
                  onClick={() => handleAction('Harvest')}
                  disabled={isLoading}
                  className="w-full plexi-button-success"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4 mr-2" />}
                  Trigger Harvest
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="plexi-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Strategy Parameters</span>
                </CardTitle>
                <CardDescription>
                  Update vault strategy configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hedgeRatio">Hedge Ratio (%)</Label>
                  <Input
                    id="hedgeRatio"
                    type="number"
                    defaultValue="65"
                    className="plexi-input mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="farmingRatio">Farming Ratio (%)</Label>
                  <Input
                    id="farmingRatio"
                    type="number"
                    defaultValue="35"
                    className="plexi-input mt-2"
                  />
                </div>
                <Button className="w-full plexi-button-secondary">
                  Update Parameters
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="plexi-card"
        >
          <h3 className="text-xl font-semibold mb-6">System Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-accent/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Hyperliquid</span>
                <div className="w-3 h-3 bg-accent rounded-full"></div>
              </div>
              <p className="font-semibold text-accent">Operational</p>
            </div>
            
            <div className="p-4 bg-accent/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">TAPP Protocol</span>
                <div className="w-3 h-3 bg-accent rounded-full"></div>
              </div>
              <p className="font-semibold text-accent">Operational</p>
            </div>
            
            <div className="p-4 bg-yellow-500/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">CLOB Aggregator</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="font-semibold text-yellow-500">Maintenance</p>
            </div>
          </div>
        </motion.div>

        {/* Emergency Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="plexi-card border-destructive/20"
        >
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive">Emergency Controls</h3>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Use these controls only in emergency situations
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Pause All Strategies
            </Button>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Emergency Withdraw
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}