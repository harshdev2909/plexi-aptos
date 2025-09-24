import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Gift, Filter } from 'lucide-react';
import { useState } from 'react';

const activities = [
  {
    id: 1,
    date: '2024-01-20 14:32',
    action: 'Deposit',
    amount: 500,
    txHash: '0xabc123def456...',
    status: 'Completed',
    icon: ArrowUpRight,
    iconColor: 'text-accent',
  },
  {
    id: 2,
    date: '2024-01-20 10:15',
    action: 'Rebalance',
    amount: 0,
    txHash: '0xdef456ghi789...',
    status: 'Completed',
    icon: RefreshCw,
    iconColor: 'text-primary',
  },
  {
    id: 3,
    date: '2024-01-19 16:45',
    action: 'Harvest',
    amount: 5.2,
    txHash: '0xghi789jkl012...',
    status: 'Completed',
    icon: Gift,
    iconColor: 'text-secondary',
  },
  {
    id: 4,
    date: '2024-01-19 09:20',
    action: 'Withdraw',
    amount: 200,
    txHash: '0xjkl012mno345...',
    status: 'Completed',
    icon: ArrowDownLeft,
    iconColor: 'text-destructive',
  },
  {
    id: 5,
    date: '2024-01-18 11:30',
    action: 'Deposit',
    amount: 750,
    txHash: '0xmno345pqr678...',
    status: 'Completed',
    icon: ArrowUpRight,
    iconColor: 'text-accent',
  },
  {
    id: 6,
    date: '2024-01-18 08:45',
    action: 'Rebalance',
    amount: 0,
    txHash: '0xpqr678stu901...',
    status: 'Completed',
    icon: RefreshCw,
    iconColor: 'text-primary',
  },
];

const filters = ['All', 'Deposit', 'Withdraw', 'Rebalance', 'Harvest'];

export function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredActivities = activeFilter === 'All' 
    ? activities 
    : activities.filter(activity => activity.action === activeFilter);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Activity</h1>
          <p className="text-muted-foreground">
            View your transaction history and vault activity
          </p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="plexi-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Activities</h3>
            <Filter className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={activeFilter === filter ? "plexi-button-primary" : ""}
              >
                {filter}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="plexi-card"
        >
          <h3 className="text-xl font-semibold mb-6">Transaction History</h3>
          
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.action === 'Deposit' ? 'bg-accent/10' :
                    activity.action === 'Withdraw' ? 'bg-destructive/10' :
                    activity.action === 'Rebalance' ? 'bg-primary/10' :
                    'bg-secondary/10'
                  }`}>
                    <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{activity.action}</p>
                      <Badge variant={getStatusBadgeVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {activity.amount > 0 && (
                    <p className={`font-semibold mb-1 ${
                      activity.action === 'Deposit' ? 'text-accent' :
                      activity.action === 'Withdraw' ? 'text-destructive' :
                      'text-secondary'
                    }`}>
                      {activity.action === 'Withdraw' ? '-' : '+'}${activity.amount}
                      {activity.action === 'Harvest' ? '' : ' USDC'}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors cursor-pointer">
                    {activity.txHash}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activities found for the selected filter.</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button variant="outline" className="hover:bg-muted/30">
              Load More Activities
            </Button>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="plexi-card text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Deposits</p>
            <p className="text-2xl font-bold text-accent">$1,250</p>
          </div>
          <div className="plexi-card text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Withdrawals</p>
            <p className="text-2xl font-bold text-destructive">$200</p>
          </div>
          <div className="plexi-card text-center">
            <p className="text-sm text-muted-foreground mb-2">Net Position</p>
            <p className="text-2xl font-bold text-foreground">$1,050</p>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}