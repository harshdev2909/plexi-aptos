import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePetraWallet } from '@/hooks/usePetraWallet';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Header() {
  const {
    isConnected,
    address,
    balance,
    isLoading: isConnecting,
    isAuthenticated,
    connect,
    disconnect
  } = usePetraWallet();

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
                <p className="text-foreground font-medium">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </p>
                <p className="text-muted-foreground">
                  {balance.toFixed(4)} APT
                  {isAuthenticated && <span className="ml-2 text-green-600">✓</span>}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Wallet className="w-4 h-4 mr-2" />
                    {wallet?.name || 'Wallet'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(address || '')}
                    disabled={!address}
                  >
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open(`https://explorer.aptoslabs.com/account/${address}?network=testnet`, '_blank')}
                    disabled={!address}
                  >
                    View on Explorer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={disconnect}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isConnecting}
                  className="plexi-button-primary"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {wallets?.map((w: any) => (
                  <DropdownMenuItem key={w.name} onClick={() => connect(w.name)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    {w.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}