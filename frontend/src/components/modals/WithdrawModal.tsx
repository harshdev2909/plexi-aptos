import { useState, useEffect } from 'react';
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

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionComplete?: () => void;
}

export function WithdrawModal({ open, onOpenChange, onTransactionComplete }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'success' | 'error'>('input');
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userShares, setUserShares] = useState(0);
  const [sharesLoading, setSharesLoading] = useState(false);

  const { isConnected, signAndSubmitTransaction } = usePetraWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user address from auth context
  const userAddress = user?.address;

  // Fetch user shares from backend when modal opens
  useEffect(() => {
    if (open && userAddress) {
      fetchUserShares();
    }
  }, [open, userAddress]);

  const fetchUserShares = async () => {
    setSharesLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/vault/user/${userAddress}`);
      if (response.ok) {
        const data = await response.json();
        const sharesValue = parseFloat(data.data.shares || '0');
        setUserShares(sharesValue);
      } else {
        console.warn('Failed to fetch user shares from backend, status:', response.status);
        setUserShares(0);
      }
    } catch (error) {
      console.warn('Backend API unavailable, using 0 shares:', error);
      setUserShares(0);
    } finally {
      setSharesLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawShares = parseFloat(amount);
    if (withdrawShares <= 0 || withdrawShares > userShares) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount within your available shares.',
        variant: 'destructive',
      });
      return;
    }

    if (!isConnected || !userAddress) {
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

      // Convert shares to APT (100 shares = 1 APT)
      const aptAmount = withdrawShares / 100;

      // Create a transaction payload for the user to sign
      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v4::user_withdraw`,
        arguments: [(aptAmount * 100000000).toString()], // Scale by 10^8 for APT decimals
        type_arguments: [],
      };

      // Sign and submit the transaction using Petra wallet
      const result = await signAndSubmitTransaction(transactionPayload);

      if (result.hash) {
        setTxHash(result.hash);

        // Call backend API to record the withdrawal and update user shares
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/vault/withdraw`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: userAddress,
              shares: withdrawShares,
              txHash: result.hash
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
          title: 'Withdrawal Successful!',
          description: `Withdrew ${withdrawShares} MST tokens (${aptAmount} APT). Transaction: ${result.hash}`,
          duration: 5000,
        });

        onTransactionComplete?.();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
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
          title: 'Withdrawal Failed',
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
              <Label htmlFor="amount">Withdraw Amount (MST tokens)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="plexi-input mt-2"
                disabled={sharesLoading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {sharesLoading ? 'Loading...' : `Available: ${userShares.toLocaleString()} MST tokens`}
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl">
              <h4 className="font-medium mb-2">You will receive:</h4>
              <p className="text-lg font-semibold">~{amount ? (parseFloat(amount) / 100).toFixed(4) : '0.0000'} APT</p>
              <p className="text-sm text-muted-foreground">100 MST tokens = 1 APT</p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > userShares}
              className="w-full plexi-button-primary"
              size="lg"
            >
Withdraw APT
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
            <h3 className="text-lg font-semibold mt-4">Processing Withdrawal...</h3>
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
            <h3 className="text-lg font-semibold mb-2">Withdrawal Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Successfully withdrew {amount} MST tokens ({amount ? (parseFloat(amount) / 100).toFixed(4) : '0'} APT)
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
            <h3 className="text-lg font-semibold mb-2">Withdrawal Failed</h3>
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
          <DialogTitle className="plexi-glow-text">Withdraw from Plexi Vault</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}