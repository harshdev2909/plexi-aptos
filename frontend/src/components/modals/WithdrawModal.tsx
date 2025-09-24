import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVaultStore } from '@/store/useVaultStore';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'success' | 'error'>('input');
  const [txHash, setTxHash] = useState('');
  
  const { withdraw, stats, isLoading } = useVaultStore();
  const { toast } = useToast();

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0 || withdrawAmount > stats.userShares) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount within your balance.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStep('pending');
      await withdraw(withdrawAmount);
      setTxHash('0x' + Math.random().toString(16).substr(2, 8));
      setStep('success');
      toast({
        title: 'Withdrawal Successful!',
        description: `Successfully withdrew ${withdrawAmount} USDC from Plexi vault.`,
      });
    } catch (error) {
      setStep('error');
      toast({
        title: 'Withdrawal Failed',
        description: 'Transaction failed. Please try again.',
        variant: 'destructive',
      });
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
              <Label htmlFor="amount">Withdraw Amount (Shares)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="plexi-input mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Available: {stats.userShares} shares
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl">
              <h4 className="font-medium mb-2">You will receive:</h4>
              <p className="text-lg font-semibold">~{amount || '0'} USDC</p>
              <p className="text-sm text-muted-foreground">Based on current share price</p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > stats.userShares}
              className="w-full plexi-button-primary"
              size="lg"
            >
              Withdraw USDC
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
              Successfully withdrew {amount} USDC
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Transaction: {txHash}
            </p>
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