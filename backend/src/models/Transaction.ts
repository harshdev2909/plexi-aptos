import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  txHash: string;
  walletAddress: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  shares: number;
  status: 'pending' | 'completed' | 'failed';
  blockHeight?: number;
  gasUsed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  txHash: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid transaction hash format'
    }
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  blockHeight: {
    type: Number,
    min: 0
  },
  gasUsed: {
    type: Number,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for efficient queries
TransactionSchema.index({ walletAddress: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);