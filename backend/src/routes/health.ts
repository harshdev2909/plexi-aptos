import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { VaultService } from '../services/vault-service';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const vaultService = new VaultService();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json({
    success: true,
    data: healthCheck
  });
}));

/**
 * GET /health/detailed
 * Detailed health check with service dependencies
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const checks = {
    database: 'unknown',
    aptos: 'unknown',
    vault: 'unknown'
  };

  let overallStatus = 'OK';

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      checks.database = 'connected';
    } else {
      checks.database = 'disconnected';
      overallStatus = 'DEGRADED';
    }
  } catch (error) {
    checks.database = 'error';
    overallStatus = 'DEGRADED';
  }

  // Check Aptos connection
  try {
    await vaultService.getVaultState();
    checks.aptos = 'connected';
    checks.vault = 'operational';
  } catch (error) {
    checks.aptos = 'error';
    checks.vault = 'error';
    overallStatus = 'DEGRADED';
  }

  const healthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks
  };

  const statusCode = overallStatus === 'OK' ? 200 : 503;
  
  res.status(statusCode).json({
    success: overallStatus === 'OK',
    data: healthCheck
  });
}));

export default router;
