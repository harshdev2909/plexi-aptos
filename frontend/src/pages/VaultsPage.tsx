import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVaultData } from '../hooks/useVaultData';
import { apiService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { VaultOperations } from '../components/VaultOperations';
import { TransactionHistory } from '../components/TransactionHistory';
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const VaultsPage: React.FC = () => {
  const { user } = useAuth();
  const { vaultState, userPosition, vaultEvents, isLoading, refetch } = useVaultData();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [mintShares, setMintShares] = useState('');
  const [redeemShares, setRedeemShares] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleDeposit = async () => {
    if (!user?.address || !depositAmount) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.deposit(user.address, depositAmount);
      if (result.success) {
        toast({
          title: 'Deposit Successful',
          description: `Deposited ${formatCurrency(depositAmount)} to vault`,
        });
        setDepositAmount('');
        refetch();
      } else {
        throw new Error(result.error || 'Deposit failed');
      }
    } catch (error: any) {
      toast({
        title: 'Deposit Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.address || !withdrawAmount) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.withdraw(user.address, withdrawAmount);
      if (result.success) {
        toast({
          title: 'Withdraw Successful',
          description: `Withdrew ${formatCurrency(withdrawAmount)} from vault`,
        });
        setWithdrawAmount('');
        refetch();
      } else {
        throw new Error(result.error || 'Withdraw failed');
      }
    } catch (error: any) {
      toast({
        title: 'Withdraw Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMint = async () => {
    if (!user?.address || !mintShares) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.mint(user.address, mintShares);
      if (result.success) {
        toast({
          title: 'Mint Successful',
          description: `Minted ${mintShares} shares`,
        });
        setMintShares('');
        refetch();
      } else {
        throw new Error(result.error || 'Mint failed');
      }
    } catch (error: any) {
      toast({
        title: 'Mint Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeem = async () => {
    if (!user?.address || !redeemShares) return;
    
    setIsProcessing(true);
    try {
      const result = await apiService.redeem(user.address, redeemShares);
      if (result.success) {
        toast({
          title: 'Redeem Successful',
          description: `Redeemed ${redeemShares} shares`,
        });
        setRedeemShares('');
        refetch();
      } else {
        throw new Error(result.error || 'Redeem failed');
      }
    } catch (error: any) {
      toast({
        title: 'Redeem Failed',
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vault Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultState ? formatCurrency(vaultState.totalAssets) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {vaultState?.assetToken || 'APT'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultState ? formatNumber(vaultState.totalShares) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Vault shares outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Position</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPosition ? formatCurrency(userPosition.assetsEquivalent) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userPosition ? formatNumber(userPosition.shares) : '0'} shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Rebalance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultState?.lastRebalanceTimestamp 
                ? formatDate(vaultState.lastRebalanceTimestamp)
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {vaultState?.strategiesCount || 0} strategies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vault Actions */}
      <Tabs defaultValue="deposit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Deposit Assets
              </CardTitle>
              <CardDescription>
                Deposit {vaultState?.assetToken || 'APT'} to receive vault shares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleDeposit} 
                disabled={!depositAmount || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Deposit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Minus className="w-5 h-5 mr-2" />
                Withdraw Assets
              </CardTitle>
              <CardDescription>
                Withdraw {vaultState?.assetToken || 'APT'} by burning vault shares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleWithdraw} 
                disabled={!withdrawAmount || isProcessing}
                className="w-full"
                variant="destructive"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 mr-2" />
                    Withdraw
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mint">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Mint Shares
              </CardTitle>
              <CardDescription>
                Mint vault shares directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mint-shares">Shares</Label>
                <Input
                  id="mint-shares"
                  type="number"
                  placeholder="0"
                  value={mintShares}
                  onChange={(e) => setMintShares(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleMint} 
                disabled={!mintShares || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Mint
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Minus className="w-5 h-5 mr-2" />
                Redeem Shares
              </CardTitle>
              <CardDescription>
                Redeem vault shares for assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redeem-shares">Shares</Label>
                <Input
                  id="redeem-shares"
                  type="number"
                  placeholder="0"
                  value={redeemShares}
                  onChange={(e) => setRedeemShares(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleRedeem} 
                disabled={!redeemShares || isProcessing}
                className="w-full"
                variant="destructive"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 mr-2" />
                    Redeem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <VaultOperations onTransactionComplete={refetch} />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory 
            userAddress={user?.address || ''} 
            onRefresh={refetch}
          />
        </TabsContent>
      </Tabs>

      {/* Recent Events */}
      {vaultEvents && vaultEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest vault activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vaultEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      {event.eventType}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {event.eventType.replace('Event', '')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(new Date(event.createdAt).getTime())}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">
                      {event.txHash ? `${event.txHash.slice(0, 8)}...` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Transaction</div>
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

export default VaultsPage;