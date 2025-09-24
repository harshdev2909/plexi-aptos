import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { VaultStats } from '@/components/dashboard/VaultStats';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { QuickActions } from '@/components/dashboard/QuickActions';

export function Dashboard() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your Plexi vault performance and manage your positions
          </p>
        </div>

        <VaultStats />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <PerformanceChart />
          <QuickActions />
        </div>
      </motion.div>
    </Layout>
  );
}