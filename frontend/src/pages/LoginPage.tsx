import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePetraWallet } from '../hooks/usePetraWallet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Wallet, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const LoginPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { 
    isPetraInstalled, 
    connect, 
    isConnected, 
    address, 
    network 
  } = usePetraWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      
      // Connect to Petra wallet
      await connect();
      
      
      // Authenticate with backend
      await login();
      
      toast({
        title: 'Success!',
        description: 'Petra wallet connected and authenticated successfully.',
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Petra wallet connection error:', err);
      const errorMessage = err.message || 'Failed to connect Petra wallet';
      setError(errorMessage);
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallPetra = () => {
    window.open('https://petra.app/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Connect Petra Wallet</CardTitle>
          <CardDescription>
            Connect your Petra wallet to access Plexi trading platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isPetraInstalled ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Petra wallet is not installed. Please install it to continue.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleInstallPetra}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Install Petra Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Petra Wallet
                  </>
                )}
              </Button>
              
              {isConnected && address && (
                <div className="text-center text-sm text-gray-600">
                  <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
                  <p>Network: {network}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 mt-2">
            <p>Petra is the official Aptos wallet</p>
            <p>Secure • Fast • Easy to use</p>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>By connecting your wallet, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;