import { z } from 'zod';

// Wallet address validation
export const walletAddressSchema = z.string()
  .min(1, 'Wallet address is required')
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos wallet address format');

// Amount validation - handle string to number conversion
export const amountSchema = z.union([
  z.number().positive('Amount must be positive').finite('Amount must be a valid number'),
  z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Amount must be a valid number');
    if (num <= 0) throw new Error('Amount must be positive');
    return num;
  })
]);

// Shares validation - handle string to number conversion
export const sharesSchema = z.union([
  z.number().nonnegative('Shares must be non-negative').finite('Shares must be a valid number'),
  z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Shares must be a valid number');
    if (num < 0) throw new Error('Shares must be non-negative');
    return num;
  })
]);

// Transaction hash validation
export const txHashSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format');

// Deposit request validation
export const depositRequestSchema = z.object({
  walletAddress: walletAddressSchema,
  amount: amountSchema,
  txHash: txHashSchema.optional() // Optional for backward compatibility
});

// Withdraw request validation
export const withdrawRequestSchema = z.object({
  walletAddress: walletAddressSchema,
  shares: sharesSchema,
  txHash: txHashSchema.optional() // Optional for backward compatibility
});


// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10)
});

// Query parameters validation
export const queryParamsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  type: z.enum(['deposit', 'withdraw']).optional()
});

export type DepositRequest = z.infer<typeof depositRequestSchema>;
export type WithdrawRequest = z.infer<typeof withdrawRequestSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type QueryParams = z.infer<typeof queryParamsSchema>;
