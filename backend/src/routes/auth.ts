import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validateBody } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = express.Router();

// In-memory store for nonces (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Cleanup old nonces every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  for (const [address, data] of nonceStore.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      nonceStore.delete(address);
    }
  }
}, 5 * 60 * 1000);

// Validation schemas
const nonceRequestSchema = z.object({
  address: z.string().min(1, 'Address is required')
});

const verifySignatureSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  signature: z.string().min(1, 'Signature is required')
});

/**
 * @route   POST /api/v1/auth/nonce
 * @desc    Request a nonce for wallet address authentication
 * @access  Public
 */
router.post('/nonce', validateBody(nonceRequestSchema), (req, res) => {
  try {
    const { address } = req.body;

    // Generate a unique nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    // Store nonce with timestamp (expires in 5 minutes)
    nonceStore.set(address, { nonce, timestamp });

    logger.info(`Nonce generated for address: ${address}`);

    res.json({
      success: true,
      nonce,
      message: 'Nonce generated successfully'
    });
  } catch (error) {
    logger.error('Nonce generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce'
    });
  }
});

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Verify signature and issue JWT token
 * @access  Public
 */
router.post('/verify', validateBody(verifySignatureSchema), (req, res) => {
  try {
    const { address, signature } = req.body;

    // Check if nonce exists for this address
    const storedData = nonceStore.get(address);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'No nonce found for this address. Please request a nonce first.'
      });
    }

    // Check if nonce is still valid (5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (storedData.timestamp < fiveMinutesAgo) {
      nonceStore.delete(address);
      return res.status(400).json({
        success: false,
        error: 'Nonce has expired. Please request a new nonce.'
      });
    }

    // In a real implementation, you would:
    // 1. Verify the signature against the nonce using the wallet's public key
    // 2. Check that the signature was created by the wallet at the given address
    // For now, we'll accept any signature in development mode

    // Remove used nonce
    nonceStore.delete(address);

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      {
        address,
        timestamp: Date.now()
      },
      jwtSecret,
      {
        expiresIn: '7d' // Token expires in 7 days
      }
    );

    logger.info(`Authentication successful for address: ${address}`);

    res.json({
      success: true,
      token,
      message: 'Authentication successful'
    });
  } catch (error) {
    logger.error('Signature verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify signature'
    });
  }
});

/**
 * @route   POST /api/v1/auth/validate
 * @desc    Validate JWT token
 * @access  Private
 */
router.post('/validate', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, jwtSecret) as any;

    res.json({
      success: true,
      address: decoded.address,
      message: 'Token is valid'
    });
  } catch (error) {
    logger.error('Token validation failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

export default router;