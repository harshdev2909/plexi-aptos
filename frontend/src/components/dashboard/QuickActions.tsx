import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Gift } from 'lucide-react';
import { useState } from 'react';
import { DepositModal } from '@/components/modals/DepositModal';
import { WithdrawModal } from '@/components/modals/WithdrawModal';
import { useVaultStore } from '@/store/useVaultStore';
import { useToast } from '@/hooks/use-toast';

export function QuickActions() {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { claimRewards, stats } = useVaultStore();
  const { toast } = useToast();

  const handleClaimRewards = async () => {
    try {
      await claimRewards();
      toast({
        title: 'Rewards Claimed!',
        description: `Successfully claimed ${stats.totalRewards} USDC in rewards.`,
      });
    } catch (error) {
      toast({
        title: 'Claim Failed',
        description: 'Failed to claim rewards. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="plexi-card lg:col-span-2"
      >
        <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
        
        <div className="space-y-4">
          <Button
            onClick={() => setShowDeposit(true)}
            className="w-full plexi-button-primary justify-start"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-3" />
            Deposit USDC
          </Button>
          
          <Button
            onClick={() => setShowWithdraw(true)}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <Minus className="w-5 h-5 mr-3" />
            Withdraw
          </Button>
          
          <Button
            onClick={handleClaimRewards}
            className="w-full plexi-button-success justify-start"
            size="lg"
            disabled={stats.totalRewards === 0}
          >
            <Gift className="w-5 h-5 mr-3" />
            Claim Rewards ({stats.totalRewards} USDC)
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/20 rounded-xl">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Next Rebalance</h4>
          <p className="text-lg font-semibold">In 2 hours</p>
          <p className="text-sm text-muted-foreground">Automated strategy optimization</p>
        </div>
      </motion.div>

      <DepositModal open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} />
    </>
  );
}