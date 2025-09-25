import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { usePetraWallet } from '@/hooks/usePetraWallet';

interface TransactionStatusProps {
  txHash: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  txHash,
  onClose,
  onSuccess,
  onError,
}) => {
  const { aptos } = usePetraWallet();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | 'timeout'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmTransaction = async () => {
      if (!aptos || !txHash) return;

      try {
        const result = await aptos.waitForTransaction({
          transactionHash: txHash,
          options: {
            timeoutSecs: 60,
            checkSuccess: true,
          }
        });

        if (result.success) {
          setStatus('success');
          onSuccess?.();
        } else {
          setStatus('failed');
          const errorMsg = 'Transaction failed during execution';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (error: any) {
        console.error('Transaction confirmation error:', error);

        if (error.message?.includes('timeout')) {
          setStatus('timeout');
          setError('Transaction confirmation timed out. It may still succeed.');
        } else {
          setStatus('failed');
          const errorMsg = error.message || 'Failed to confirm transaction';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      }
    };

    confirmTransaction();
  }, [txHash, aptos, onSuccess, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'timeout':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Clock className="h-6 w-6 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Confirming Transaction...';
      case 'success':
        return 'Transaction Confirmed!';
      case 'failed':
        return 'Transaction Failed';
      case 'timeout':
        return 'Confirmation Timeout';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${getStatusColor()}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          {getStatusText()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Transaction Hash:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {txHash.slice(0, 10)}...{txHash.slice(-10)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              This may take up to 30 seconds...
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="text-center">
            <p className="text-sm text-yellow-700">
              The transaction may still complete successfully. You can check the explorer link above.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {status !== 'pending' && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(txHash)}
            className="w-full"
          >
            Copy Hash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};