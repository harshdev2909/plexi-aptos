import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Wallet, TrendingUp, Shield, BarChart3, Zap } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLaunchApp = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Plexi</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLaunchApp}>
                <Wallet className="w-4 h-4 mr-2" />
                Launch App
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Plexi
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unified Perp Trading Orchestration on Aptos + Hyperliquid
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Seamlessly trade perpetuals across multiple chains with advanced automation, 
            risk management, and yield optimization strategies.
          </p>
          
          <Button size="lg" onClick={handleLaunchApp} className="text-lg px-8 py-6">
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet & Start Trading
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Advanced Trading</CardTitle>
              <CardDescription>
                Trade perpetuals with sophisticated order routing and execution
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Automated stop-loss, take-profit, and position sizing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Comprehensive P&L tracking and performance analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Automation</CardTitle>
              <CardDescription>
                Smart rebalancing and yield optimization strategies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Statistics
            </h2>
            <p className="text-gray-600">
              Real-time metrics from our trading platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">$2.4M</div>
              <div className="text-gray-600">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">1,250</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">15,420</div>
              <div className="text-gray-600">Trades Executed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">98.5%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet and experience the future of DeFi trading
          </p>
          <Button size="lg" onClick={handleLaunchApp} className="text-lg px-8 py-6">
            <Wallet className="w-5 h-5 mr-2" />
            Get Started Now
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Plexi</h3>
            <p className="text-gray-400 mb-4">
              Unified Perp Trading Orchestration on Aptos + Hyperliquid
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline">Built on Aptos</Badge>
              <Badge variant="outline">Hyperliquid Integration</Badge>
              <Badge variant="outline">DeFi Native</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;