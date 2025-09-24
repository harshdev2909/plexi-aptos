import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Zap, Target, Gift, BarChart3 } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  const features = [
    {
      icon: Shield,
      title: 'Hyperliquid Hedging',
      description: 'Automated risk management through sophisticated hedging strategies on Hyperliquid.',
    },
    {
      icon: TrendingUp,
      title: 'TAPP Farming',
      description: 'Maximize yields through optimized farming on TAPP protocol with dynamic allocation.',
    },
    {
      icon: Zap,
      title: 'Auto-Rebalancing',
      description: 'Smart rebalancing algorithms continuously optimize your portfolio for maximum returns.',
    },
    {
      icon: Target,
      title: 'CLOB Aggregation',
      description: 'Access the best prices across Central Limit Order Books for optimal execution.',
    },
    {
      icon: Gift,
      title: 'Automated Rewards',
      description: 'Earn and compound rewards automatically without manual intervention.',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track your vault performance with detailed analytics and real-time metrics.',
    },
  ];

  return (
    <div className="min-h-screen bg-background plexi-hero-bg">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-6">
              <div className="inline-flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
            <h1 
              className="text-5xl md:text-7xl font-bold plexi-glow-text cursor-pointer" 
              onDoubleClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }))}
            >
              Plexi
            </h1>
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
              Self-driving DeFi vaults on Aptos
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Deposit once, let automation hedge, farm & rebalance for you. 
              Experience the future of DeFi with Plexi's intelligent vault strategies.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onLaunchApp}
                size="lg"
                className="plexi-button-primary text-lg px-8 py-4 rounded-2xl"
              >
                Launch App
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="plexi-card"
            >
              <h3 className="text-2xl font-bold mb-4 text-destructive">The Problem</h3>
              <p className="text-muted-foreground leading-relaxed">
                DeFi is complex. Managing multiple protocols, timing rebalances, 
                and optimizing yields requires constant attention and expertise. 
                Most users struggle to maximize returns while managing risk effectively.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="plexi-card"
            >
              <h3 className="text-2xl font-bold mb-4 text-accent">Our Solution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Plexi automates everything. Our AI-driven vault handles hedging, 
                farming, and rebalancing across multiple protocols, delivering 
                optimized returns while you focus on what matters most.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold mb-4">Powerful Features</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced DeFi strategies powered by automation and AI
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="plexi-card-hover text-center"
              >
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-3xl font-bold mb-6">Ready to Start?</h3>
            <p className="text-muted-foreground text-lg mb-8">
              Join the future of automated DeFi. Deposit your USDC and watch your wealth grow.
            </p>
            <Button
              onClick={onLaunchApp}
              size="lg"
              className="plexi-button-primary text-lg px-8 py-4 rounded-2xl"
            >
              Launch Plexi App
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold">Plexi</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Built for the Aptos ecosystem. Powered by automation.
          </p>
        </div>
      </footer>
    </div>
  );
}