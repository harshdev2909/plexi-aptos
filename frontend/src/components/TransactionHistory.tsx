import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'MINT' | 'REDEEM';
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  timestamp: string;
  txHash: string;
  userAddress: string;
}

interface TransactionHistoryProps {
  userAddress: string;
  onRefresh?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userAddress,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load transactions from localStorage
  useEffect(() => {
    loadTransactions();
  }, [userAddress]);

  const loadTransactions = () => {
    try {
      const stored = localStorage.getItem('plexix_transactions');
      if (stored) {
        const allTransactions = JSON.parse(stored);
        // Filter transactions for current user
        const userTransactions = allTransactions.filter(
          (tx: Transaction) => tx.userAddress === userAddress
        );
        setTransactions(userTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'text-green-600';
      case 'WITHDRAW':
        return 'text-red-600';
      case 'MINT':
        return 'text-blue-600';
      case 'REDEEM':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadTransactions();
    onRefresh?.();
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'History Refreshed',
        description: 'Transaction history has been updated',
      });
    }, 1000);
  };

  const openTransaction = (txHash: string) => {
    // Open transaction in Aptos Explorer
    const explorerUrl = `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent vault transactions
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Your vault transactions will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                        <span className="font-semibold">
                          {formatAmount(transaction.amount)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(transaction.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTransaction(transaction.txHash)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
