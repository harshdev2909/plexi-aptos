import { motion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';
import { useVaultStore } from '@/store/useVaultStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatAptAmount } from '@/utils/formatters';
import { TrendingUp, DollarSign, PieChart, BarChart3, Gift, Coins } from 'lucide-react';
import { useEffect } from 'react';

export function VaultStats() {
  const { stats, updateStats, setUserAddress } = useVaultStore();
  const { user } = useAuth();

  // Set user address and update stats when user changes
  useEffect(() => {
    if (user?.address) {
      setUserAddress(user.address);
      updateStats();
    }
  }, [user?.address, setUserAddress, updateStats]);


  const getAptValue = (aptAmount: number) => {
    if (stats.aptPrice) {
      return formatCurrency(aptAmount * stats.aptPrice.price);
    }
    return `${formatAptAmount(aptAmount)} APT`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatCard
          title="Total Value Locked"
          value={getAptValue(stats.tvl)}
          subtitle={stats.aptPrice ? `@ $${stats.aptPrice.price.toFixed(2)} APT` : "APT"}
          icon={Coins}
          trend={stats.aptPrice ? { value: stats.aptPrice.change24h, isPositive: stats.aptPrice.change24h >= 0 } : undefined}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          title="Your Position"
          value={getAptValue(stats.userBalance)}
          subtitle={`${formatAptAmount(stats.userShares)} shares`}
          icon={TrendingUp}
          trend={stats.aptPrice ? { value: stats.aptPrice.change24h, isPositive: stats.aptPrice.change24h >= 0 } : undefined}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatCard
          title="Hedge Allocation"
          value={`${stats.hedgePercentage}%`}
          subtitle="Hyperliquid"
          icon={PieChart}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StatCard
          title="Farming Allocation"
          value={`${stats.farmingAllocation}%`}
          subtitle="TAPP Protocol"
          icon={BarChart3}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <StatCard
          title="Total Rewards"
          value={formatCurrency(stats.totalRewards)}
          subtitle="Claimable"
          icon={Gift}
          trend={{ value: 15.3, isPositive: true }}
        />
      </motion.div>
    </div>
  );
}