import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/useWalletStore';
import { Wallet, LogOut } from 'lucide-react';

export function Header() {
  const { isConnected, address, isLoading, connect, disconnect } = useWalletStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-2"
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 
            className="text-2xl font-bold plexi-glow-text cursor-pointer" 
            onDoubleClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }))}
          >
            Plexi
          </h1>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'strategies' }))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Strategies
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'rewards' }))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Rewards
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'activity' }))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Activity
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <p className="text-foreground font-medium">{address}</p>
                <p className="text-muted-foreground">1,000 USDC</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isLoading}
              className="plexi-button-primary"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}