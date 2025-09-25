import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { apiService } from '../services/api';
import { usePetraWallet } from '../hooks/usePetraWallet';
import { useAuth } from '../contexts/AuthContext';

interface VaultOperationsProps {
  onTransactionComplete?: () => void;
}

export const VaultOperations: React.FC<VaultOperationsProps> = ({
  onTransactionComplete,
}) => {
  const [mintAmount, setMintAmount] = useState<number>(1000);
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signAndSubmitTransaction, isConnected } = usePetraWallet();
  const { user } = useAuth();

  // Get user address from auth context
  const userAddress = user?.address;

  const handleRegisterUsdc = async () => {
    try {
      setIsLoading(true);
      if (!isConnected || !userAddress) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your Petra wallet to register USDC.',
          variant: 'destructive',
        });
        return;
      }

      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v4::register_apt`,
        arguments: [],
        type_arguments: [],
      };

      const result = await signAndSubmitTransaction(transactionPayload);
      if (result.hash) {
        toast({
        title: 'APT Registration Successful',
        description: `APT support registered. Transaction: ${result.hash}`,
          duration: 5000,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to register USDC:', error);
      toast({
        title: 'APT Registration Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintUsdc = async () => {
    try {
      setIsLoading(true);
      
      // Check if wallet is connected
      if (!isConnected || !userAddress) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return;
      }

      // Create a transaction payload for the user to sign
      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v4::user_mint`,
        arguments: [(mintAmount * 100000000).toString()], // Scale by 10^8 for APT decimals
        type_arguments: [],
      };

      // Sign and submit the transaction using admin wallet
      const result = await signAndSubmitTransaction(transactionPayload);
      
      if (result.hash) {
        // Show success notification
        toast({
          title: 'Shares Minted Successfully',
          description: `${mintAmount} shares minted. Transaction: ${result.hash}`,
          duration: 5000,
        });

        // Store transaction in history
        const transactionRecord = {
          id: result.hash,
          type: 'MINT',
          amount: mintAmount,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          txHash: result.hash,
          userAddress,
        };

        // Store in localStorage for now (in production, this would be handled by the backend)
        const existingTransactions = JSON.parse(localStorage.getItem('plexix_transactions') || '[]');
        existingTransactions.unshift(transactionRecord);
        localStorage.setItem('plexix_transactions', JSON.stringify(existingTransactions));

        onTransactionComplete?.();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Mint error:', error);
      
      // Check if it's an axios error with response data
      if (error.response?.data) {
        console.error('API Error Response:', error.response.data);
        toast({
          title: 'Mint Failed',
          description: error.response.data.message || 'Failed to mint shares',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsLoading(true);
      
      // Check if wallet is connected
      if (!isConnected || !userAddress) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return;
      }

      // Create a transaction payload for the user to sign
      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v4::user_deposit`,
        arguments: [(depositAmount * 100000000).toString()], // Scale by 10^8 for APT decimals
        type_arguments: [],
      };

      // Sign and submit the transaction using admin wallet
      const result = await signAndSubmitTransaction(transactionPayload);
      
      if (result.hash) {
        // Show success notification
        toast({
          title: 'Deposit Successful',
          description: `Deposited ${depositAmount} APT. Transaction: ${result.hash}`,
          duration: 5000,
        });

        // Store transaction in history
        const transactionRecord = {
          id: result.hash,
          type: 'DEPOSIT',
          amount: depositAmount,
          shares: depositAmount, // 1:1 ratio for now
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          txHash: result.hash,
          userAddress,
        };

        // Store in localStorage for now (in production, this would be handled by the backend)
        const existingTransactions = JSON.parse(localStorage.getItem('plexix_transactions') || '[]');
        existingTransactions.unshift(transactionRecord);
        localStorage.setItem('plexix_transactions', JSON.stringify(existingTransactions));

        onTransactionComplete?.();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      
      // Check if it's an axios error with response data
      if (error.response?.data) {
        console.error('API Error Response:', error.response.data);
        toast({
          title: 'Deposit Failed',
          description: error.response.data.message || 'Failed to deposit',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      
      // Check if wallet is connected
      if (!isConnected || !userAddress) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return;
      }

      // Create a transaction payload for the user to sign
      const transactionPayload = {
        type: 'entry_function_payload',
        function: `0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2::vault_v4::user_withdraw`,
        arguments: [(withdrawAmount * 100000000).toString()], // Scale by 10^8 for APT decimals
        type_arguments: [],
      };

      // Sign and submit the transaction using admin wallet
      const result = await signAndSubmitTransaction(transactionPayload);
      
      if (result.hash) {
        // Show success notification
        toast({
          title: 'Withdrawal Successful',
          description: `Withdrew ${withdrawAmount} APT. Transaction: ${result.hash}`,
          duration: 5000,
        });

        // Store transaction in history
        const transactionRecord = {
          id: result.hash,
          type: 'WITHDRAW',
          amount: withdrawAmount,
          shares: withdrawAmount,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          txHash: result.hash,
          userAddress,
        };

        // Store in localStorage for now (in production, this would be handled by the backend)
        const existingTransactions = JSON.parse(localStorage.getItem('plexix_transactions') || '[]');
        existingTransactions.unshift(transactionRecord);
        localStorage.setItem('plexix_transactions', JSON.stringify(existingTransactions));

        onTransactionComplete?.();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      
      // Check if it's an axios error with response data
      if (error.response?.data) {
        console.error('API Error Response:', error.response.data);
        toast({
          title: 'Withdraw Failed',
          description: error.response.data.message || 'Failed to withdraw',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Vault Operations</CardTitle>
        <CardDescription>
               Manage your vault deposits, withdrawals, and APT minting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mint" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mint">Mint Shares</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="mint" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mint-amount">Shares to Mint</Label>
              <Input
                id="mint-amount"
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(Number(e.target.value))}
                placeholder="Enter shares to mint"
              />
            </div>
            <Button
              onClick={handleRegisterUsdc}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
                     {isLoading ? 'Registering...' : 'Register APT Support (Required First)'}
            </Button>
            <Button
              onClick={handleMintUsdc}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Minting...' : 'Mint Shares'}
            </Button>
                   <p className="text-sm text-muted-foreground">
                     First register APT support, then mint new shares directly to your account.
                   </p>
          </TabsContent>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (APT)</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                placeholder="Enter amount to deposit"
              />
            </div>
            <Button
              onClick={handleDeposit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Depositing...' : 'Deposit to Vault'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Deposit APT into the vault to receive shares.
            </p>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Shares to Burn</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                placeholder="Enter shares to burn"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Withdrawing...' : 'Withdraw from Vault'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Withdraw APT from the vault by burning shares.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
