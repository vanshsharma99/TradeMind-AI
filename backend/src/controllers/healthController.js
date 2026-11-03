import { getDBStatus } from '../config/db.js';
import { config } from '../config/env.js';

export const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    success: true,
    data: {
      service: 'TradeMind AI Backend',
      version: '1.0.0',
      status: 'operational',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      phase: 'Phase 1 - Project Setup & Health Verification',
    },
  });
};
