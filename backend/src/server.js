import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import optionRoutes from './routes/optionRoutes.js';
import indicatorRoutes from './routes/indicatorRoutes.js';
import aiSignalRoutes from './routes/aiSignalRoutes.js';
import { initSocketServer, stopSocketServer } from './websocket/socketServer.js';
import { marketDataFeedService } from './services/marketDataFeedService.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/options', optionRoutes);
app.use('/api/v1/indicators', indicatorRoutes);
app.use('/api/v1/ai', aiSignalRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TradeMind AI API Gateway',
    documentation: '/api/health',
    status: 'online',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

let httpServer = null;

// Start Server
export const startServer = async () => {
  // Connect Database
  await connectDB();

  httpServer = createServer(app);

  // Initialize Socket.IO server
  initSocketServer(httpServer);

  const server = httpServer.listen(config.port, async () => {
    console.log(`\n=================================================`);
    console.log(`🚀 TradeMind AI Backend Server Started`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`⚡ WebSocket Feed V3: Active`);
    console.log(`⚙️  Environment: ${config.nodeEnv}`);
    console.log(`=================================================\n`);

    // Launch market data streaming service
    await marketDataFeedService.startFeed();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
  });

  return server;
};

export const stopServer = async () => {
  marketDataFeedService.stopFeed();
  await stopSocketServer();
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = null;
  }
};

import { fileURLToPath } from 'url';
import path from 'path';

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  startServer();
}

export default app;
