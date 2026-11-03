import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
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

// Start Server
const startServer = async () => {
  // Connect Database
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 TradeMind AI Backend Server Started`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`⚙️  Environment: ${config.nodeEnv}`);
    console.log(`=================================================\n`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
  });

  return server;
};

startServer();

export default app;
