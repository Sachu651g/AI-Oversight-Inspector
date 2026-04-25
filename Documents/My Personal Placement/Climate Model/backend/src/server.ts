import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './config/logger';
import pool from './config/database';
import redis from './config/redis';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(compression()); // Compress responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Climate Guardian API v1.0',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      risk: '/api/risk',
      simulation: '/api/simulate',
      alerts: '/api/alert',
      routes: '/api/evacuation-routes',
      audit: '/api/audit-trail',
      pattern: '/api/pattern',
    },
  });
});

// Import route handlers
import riskRoutes from './routes/riskRoutes';
import simulationRoutes from './routes/simulationRoutes';
import alertRoutes from './routes/alertRoutes';
import evacuationRoutes from './routes/evacuationRoutes';
import auditRoutes from './routes/auditRoutes';
import patternRoutes from './routes/patternRoutes';

// Use routes
app.use('/api/risk', riskRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/evacuation-routes', evacuationRoutes);
app.use('/api/audit-trail', auditRoutes);
app.use('/api/pattern', patternRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Climate Guardian Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await pool.end();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await pool.end();
  await redis.quit();
  process.exit(0);
});

export default app;
