import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { Gift, TrendingUp, Clock, History } from 'lucide-react';
import { useVaultStore } from '@/store/useVaultStore';
import { useToast } from '@/hooks/use-toast';

const rewardHistory = [
  { date: '2024-01-20', amount: 5.2, source: 'TAPP Farming', txHash: '0xabc...123' },
  { date: '2024-01-19', amount: 2.8, source: 'Strategy Fees', txHash: '0xdef...456' },
  { date: '2024-01-18', amount: 4.5, source: 'TAPP Farming', txHash: '0xghi...789' },
  { date: '2024-01-15', amount: 3.1, source: 'Performance Bonus', txHash: '0xjkl...012' },
  { date: '2024-01-14', amount: 6.2, source: 'TAPP Farming', txHash: '0xmno...345' },
];

export function RewardsPage() {
  const { stats, claimRewards, isLoading } = useVaultStore();
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

  const totalEarned = rewardHistory.reduce((sum, reward) => sum + reward.amount, 0);
  const avgDaily = totalEarned / 7; // Assuming 7 days of history

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Rewards</h1>
          <p className="text-muted-foreground">
            Track and claim your vault rewards from automated strategies
          </p>
        </div>

        {/* Reward Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Claimable Rewards"
            value={`$${stats.totalRewards.toFixed(2)}`}
            subtitle="USDC"
            icon={Gift}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Earned"
            value={`$${totalEarned.toFixed(2)}`}
            subtitle="All time"
            icon={TrendingUp}
          />
          <StatCard
            title="Daily Average"
            value={`$${avgDaily.toFixed(2)}`}
            subtitle="Last 7 days"
            icon={Clock}
          />
          <StatCard
            title="Reward APY"
            value="15.3%"
            subtitle="Estimated"
            icon={History}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Claim Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="plexi-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Available Rewards</h3>
              <p className="text-muted-foreground">
                Claim your accumulated rewards from vault strategies
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold plexi-glow-text mb-1">
                ${stats.totalRewards.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">USDC Available</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">From TAPP Farming</p>
              <p className="text-lg font-semibold">$8.20</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Strategy Fees</p>
              <p className="text-lg font-semibold">$2.80</p>
            </div>
            <div className="p-4 bg-muted/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Performance Bonus</p>
              <p className="text-lg font-semibold">$1.50</p>
            </div>
          </div>

          <Button
            onClick={handleClaimRewards}
            disabled={stats.totalRewards === 0 || isLoading}
            className="w-full md:w-auto plexi-button-success"
            size="lg"
          >
            <Gift className="w-5 h-5 mr-2" />
            {isLoading ? 'Claiming...' : `Claim ${stats.totalRewards.toFixed(2)} USDC`}
          </Button>
        </motion.div>

        {/* Reward History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="plexi-card"
        >
          <h3 className="text-xl font-semibold mb-6">Reward History</h3>
          
          <div className="space-y-4">
            {rewardHistory.map((reward, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{reward.source}</p>
                    <p className="text-sm text-muted-foreground">{reward.date}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-accent">+${reward.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{reward.txHash}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" className="hover:bg-muted/30">
              View All History
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}