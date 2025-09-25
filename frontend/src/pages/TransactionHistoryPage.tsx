import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Search, 
  ExternalLink, 
  History, 
  ArrowUpDown, 
  ArrowDownUp, 
  AlertTriangle
} from 'lucide-react';
import { TestSidebar } from '@/components/TestSidebar';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Default empty transactions when server unavailable
const defaultTransactions: Transaction[] = [];

interface Transaction {
  _id: string;
  userAddress: string;
  type: 'deposit' | 'withdraw' | 'emergency_withdraw';
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

const TransactionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(defaultTransactions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [type, setType] = useState<string>('all');

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserTransactions(user.address);
      const txData = response.data || [];
      setAllTransactions(txData);
      setTransactions(txData);
    } catch (err) {
      console.warn('Failed to fetch transactions, using empty state:', err);
      setAllTransactions(defaultTransactions);
      setTransactions(defaultTransactions);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string, decimals: number = 6) => {
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpDown className="h-4 w-4" />;
      case 'withdraw':
        return <ArrowDownUp className="h-4 w-4" />;
      case 'emergency_withdraw':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
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

  const handleSearch = () => {
    // Filter transactions based on search criteria
    let filtered = allTransactions;
    
    if (userAddress) {
      filtered = filtered.filter(tx => 
        tx.userAddress.toLowerCase().includes(userAddress.toLowerCase())
      );
    }
    
    if (type && type !== 'all') {
      filtered = filtered.filter(tx => tx.type === type);
    }
    
    setTransactions(filtered);
  };

  const handleClear = () => {
    setUserAddress('');
    setType('all');
    setTransactions(allTransactions);
  };

  const handleRefresh = async () => {
    await loadTransactions();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Testnet Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              🚀 Live on Aptos Testnet! 
            </span>
            <Badge variant="outline" className="text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-600">
              Mainnet wen?
            </Badge>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <TestSidebar />

      {/* Main Content */}
      <div className="ml-64 relative">
        {/* Top Bar */}
        <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6 relative z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Transaction History</h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-gray-600 mt-1">View all vault transactions and activity</p>
              </div>
              <Button onClick={handleRefresh} disabled={loading} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-lg bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Search className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription className="text-gray-600">Filter transactions by user address and type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="User address (0x...)"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="h-11 border-gray-300"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-11 border-gray-300">
                        <SelectValue placeholder="Transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdraw">Withdraw</SelectItem>
                        <SelectItem value="emergency_withdraw">Emergency Withdraw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} disabled={loading} className="h-11">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClear} className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600 font-medium">Error: {error}</p>
                </CardContent>
              </Card>
            )}

            {/* Transactions */}
            <Card className="shadow-lg bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <History className="h-5 w-5" />
                  Transactions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Showing {transactions.length} transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">No transactions found</h3>
                    <p className="text-gray-600">
                      {userAddress || type !== 'all' 
                        ? 'Try adjusting your filters to see more results'
                        : 'Transactions will appear here once users start depositing and withdrawing'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getTypeIcon(tx.type)}
                            </div>
                            <div>
                              <Badge className={`${getTypeColor(tx.type)} font-medium`}>
                                {tx.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatAddress(tx.userAddress)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNumber(tx.amount)} APT
                            </div>
                            <div className="text-sm text-gray-500">
                              Block #{tx.blockNumber.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>Transaction:</span>
                            <code className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                              {formatAddress(tx.txHash)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${tx.txHash}?network=testnet`, '_blank')}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-medium text-gray-700">
                            {new Date(tx.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
