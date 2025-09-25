import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { usePetraWallet } from '@/hooks/usePetraWallet';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionComplete?: () => void;
}

export function DepositModal({ open, onOpenChange, onTransactionComplete }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'success' | 'error'>('input');
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isConnected, connect, balance, signAndSubmitTransaction } = usePetraWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user address from auth context
  const userAddress = user?.address;

  const handleDeposit = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0 || depositAmount > balance) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount within your balance.',
        variant: 'destructive',
      });
      return;
    }

    if (!userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStep('pending');
      setIsLoading(true);

      // Create a transaction payload for the user to sign
      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v2::user_deposit`,
        arguments: [(depositAmount * 100000000).toString()], // Scale by 10^8 for APT decimals
        type_arguments: [],
      };

      // Sign and submit the transaction using Petra wallet
      const result = await signAndSubmitTransaction(transactionPayload);

      if (result.hash) {
        setTxHash(result.hash);

        // Calculate shares (1 APT = 100 shares as specified)
        const sharesMinted = depositAmount * 100;

        // Call backend API to record the deposit and update user shares
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/vault/deposit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: userAddress,
              amount: depositAmount,
              txHash: result.hash,
              shares: sharesMinted
            }),
          });

          if (response.ok) {
            const data = await response.json();
          } else {
          }
        } catch (backendError) {
        }

        // Clear API cache and invalidate React Query cache to refresh data
        try {
          const { apiCache } = await import('../../utils/cache');
          apiCache.clear();
          
          // Invalidate React Query cache
          await queryClient.invalidateQueries({ queryKey: ['vaultState'] });
          await queryClient.invalidateQueries({ queryKey: ['userPosition'] });
          await queryClient.invalidateQueries({ queryKey: ['vaultEvents'] });
          
        } catch (cacheError) {
        }

        setStep('success');

        toast({
          title: 'Deposit Successful!',
          description: `Deposited ${depositAmount} APT, received ${sharesMinted} shares. Transaction: ${result.hash}`,
          duration: 5000,
        });

        onTransactionComplete?.();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      setStep('error');

      // Check if it's a user rejection
      if (error.message?.includes('rejected') || error.code === 4001) {
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Deposit Failed',
          description: error.message || 'Transaction failed. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setTxHash('');
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <Label htmlFor="amount">Deposit Amount (APT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="plexi-input mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Available: {balance.toFixed(4)} APT
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl">
              <h4 className="font-medium mb-2">You will receive:</h4>
              <p className="text-lg font-semibold">{amount ? (parseFloat(amount) * 100).toLocaleString() : '0'} MST tokens</p>
              <p className="text-sm text-muted-foreground">1 APT = 100 MST tokens</p>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="w-full plexi-button-primary"
              size="lg"
            >
{isConnected ? 'Deposit APT' : 'Connect Wallet'}
            </Button>
          </motion.div>
        );

      case 'pending':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <LoadingSpinner size="lg" />
            <h3 className="text-lg font-semibold mt-4">Processing Deposit...</h3>
            <p className="text-muted-foreground">Please confirm the transaction in your wallet</p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Deposit Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Successfully deposited {amount} APT
            </p>
            <div className="text-sm text-muted-foreground mb-6">
              <p className="mb-2">Transaction Hash:</p>
              <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                {txHash}
              </p>
            </div>
            <Button onClick={handleClose} className="plexi-button-primary">
              Close
            </Button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Deposit Failed</h3>
            <p className="text-muted-foreground mb-6">
              Transaction failed. Please try again.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setStep('input')} className="plexi-button-primary w-full">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="plexi-glow-text">Deposit to Plexi Vault</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}