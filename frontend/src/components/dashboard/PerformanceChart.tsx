import { motion } from 'framer-motion';
import { PlexiChart } from '@/components/ui/PlexiChart';

const mockData = [
  { name: 'Jan 1', value: 1000 },
  { name: 'Jan 5', value: 1025 },
  { name: 'Jan 10', value: 1060 },
  { name: 'Jan 15', value: 1045 },
  { name: 'Jan 20', value: 1120 },
  { name: 'Jan 25', value: 1180 },
  { name: 'Today', value: 1250 },
];

export function PerformanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="plexi-card col-span-full lg:col-span-3"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Portfolio Performance</h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Last 30 days</span>
          <div className="flex items-center space-x-1 text-accent">
            <span>+25%</span>
            <span>↗</span>
          </div>
        </div>
      </div>
      
      <PlexiChart
        data={mockData}
        dataKey="value"
        color="hsl(var(--primary))"
        height={300}
      />
    </motion.div>
  );
}