import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/StatCard';
import { TrendingUp, Shield, BarChart3, Zap } from 'lucide-react';

const strategies = [
  {
    id: 'hyperliquid-hedge',
    name: 'Hyperliquid Hedge',
    type: 'Hedging',
    allocation: 65,
    position: 'LONG',
    leverage: '2.5x',
    pnl: 2.3,
    description: 'Automated hedging strategy using Hyperliquid perpetual futures to protect against market downturns.',
    status: 'Active',
    icon: Shield,
  },
  {
    id: 'tapp-farming',
    name: 'TAPP Farming',
    type: 'Yield Farming',
    allocation: 35,
    pool: 'USDC-APT',
    apy: 18.5,
    pnl: 1.2,
    description: 'Optimized liquidity provision on TAPP protocol with automated compound rewards.',
    status: 'Active',
    icon: TrendingUp,
  },
];

export function StrategiesPage() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Active Strategies</h1>
          <p className="text-muted-foreground">
            Monitor and analyze your vault's automated trading strategies
          </p>
        </div>

        {/* Strategy Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Strategies"
            value="2"
            subtitle="Active"
            icon={BarChart3}
          />
          <StatCard
            title="Total Allocation"
            value="100%"
            subtitle="Deployed"
            icon={Zap}
          />
          <StatCard
            title="Combined P&L"
            value="+3.5%"
            subtitle="24h"
            icon={TrendingUp}
            trend={{ value: 3.5, isPositive: true }}
          />
          <StatCard
            title="Risk Score"
            value="Medium"
            subtitle="Balanced"
            icon={Shield}
          />
        </div>

        {/* Strategy Cards */}
        <div className="grid gap-6">
          {strategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="plexi-card-hover"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <strategy.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{strategy.name}</h3>
                    <p className="text-muted-foreground">{strategy.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent/10 text-accent">
                    {strategy.status}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {strategy.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Allocation</p>
                  <p className="text-lg font-semibold">{strategy.allocation}%</p>
                </div>
                
                {strategy.position && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Position</p>
                    <p className="text-lg font-semibold">{strategy.position}</p>
                  </div>
                )}
                
                {strategy.leverage && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Leverage</p>
                    <p className="text-lg font-semibold">{strategy.leverage}</p>
                  </div>
                )}
                
                {strategy.apy && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">APY</p>
                    <p className="text-lg font-semibold text-accent">{strategy.apy}%</p>
                  </div>
                )}
                
                {strategy.pool && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pool</p>
                    <p className="text-lg font-semibold">{strategy.pool}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">24h P&L</p>
                  <p className={`text-lg font-semibold ${
                    strategy.pnl > 0 ? 'text-accent' : 'text-destructive'
                  }`}>
                    {strategy.pnl > 0 ? '+' : ''}{strategy.pnl}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CLOB Aggregation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="plexi-card"
        >
          <h3 className="text-xl font-semibold mb-4">CLOB Aggregation</h3>
          <p className="text-muted-foreground mb-6">
            Recent trades executed through our Central Limit Order Book aggregation system
          </p>
          
          <div className="space-y-4">
            {[
              { time: '2 min ago', pair: 'USDC/APT', amount: '500 USDC', price: '1.25', venue: 'Aptos DEX' },
              { time: '15 min ago', pair: 'APT/USDC', amount: '250 APT', price: '0.80', venue: 'Pancake' },
              { time: '1 hour ago', pair: 'USDC/APT', amount: '1000 USDC', price: '1.23', venue: 'Thala' },
            ].map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="font-medium">{trade.pair}</p>
                    <p className="text-muted-foreground">{trade.time}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{trade.amount}</p>
                  <p className="text-muted-foreground">@ {trade.price}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {trade.venue}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}