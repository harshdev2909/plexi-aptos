import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Coins, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface MintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MintModal({ open, onOpenChange }: MintModalProps) {
  const [amount, setAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'minting' | 'success'>('input');

  // Mock data
  const mockData = {
    currentBalance: '10,000.00',
    maxMint: '50,000.00',
    dailyLimit: '10,000.00'
  };

  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsLoading(true);
    setStep('minting');

    // Simulate minting transaction
    setTimeout(() => {
      setStep('success');
      setIsLoading(false);
    }, 3000);
  };

  const handleClose = () => {
    setAmount('1000');
    setStep('input');
    onOpenChange(false);
  };

  const formatCurrency = (value: string) => `$${value}`;

  const presetAmounts = ['100', '1000', '5000', '10000'];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Coins className="h-5 w-5" />
            {step === 'input' && 'Get Test USDC'}
            {step === 'minting' && 'Minting Test USDC'}
            {step === 'success' && 'USDC Minted Successfully'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'input' && (
            <>
              {/* Testnet Notice */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Testnet Faucet</span>
                </div>
                <p className="text-sm text-purple-700">
                  Get free test USDC tokens for testing the vault functionality. These tokens have no real value.
                </p>
              </div>

              {/* Current Balance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current USDC Balance</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(mockData.currentBalance)}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-700">Mint Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-lg border-gray-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    USDC
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Daily limit: {formatCurrency(mockData.dailyLimit)} • Max per mint: {formatCurrency(mockData.maxMint)}
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="space-y-2">
                <Label className="text-gray-700">Quick Select</Label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(preset)}
                      className={`border-gray-300 ${amount === preset ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-gray-700'}`}
                    >
                      {formatCurrency(preset)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mint Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">You will receive</span>
                      <span className="font-semibold text-green-900">
                        {formatCurrency(amount)} Test USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">New balance</span>
                      <span className="font-semibold text-green-900">
                        {formatCurrency((parseFloat(mockData.currentBalance.replace(',', '')) + parseFloat(amount)).toLocaleString())}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={handleMint}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(mockData.maxMint.replace(',', '')) || isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? 'Minting...' : `Mint ${amount ? formatCurrency(amount) : ''} Test USDC`}
              </Button>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Testnet Only</p>
                  <p>These are test tokens with no real value. Use them to explore the vault functionality safely.</p>
                </div>
              </div>
            </>
          )}

          {step === 'minting' && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <Coins className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Minting Test USDC</h3>
                <p className="text-sm text-gray-600">
                  Creating {formatCurrency(amount)} test USDC tokens...
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(amount)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">Arbitrum Sepolia</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">USDC Minted Successfully!</h3>
                <p className="text-sm text-gray-600">
                  Test USDC tokens have been added to your wallet.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Minted:</span>
                    <span className="font-medium text-green-900">{formatCurrency(amount)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">New Balance:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency((parseFloat(mockData.currentBalance.replace(',', '')) + parseFloat(amount)).toLocaleString())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Transaction:</span>
                    <span className="font-mono text-xs text-green-900">0x1234...abcd</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep('input');
                    setAmount('1000');
                  }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Mint More USDC
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
