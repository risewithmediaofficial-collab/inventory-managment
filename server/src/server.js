import http from 'http';
import app from './app.js';
import connectDB from './config/database.js';
import { initSocket } from './config/socket.js';
import logger from './config/logger.js';
import { seedDatabase } from './seed.js';
import env from './config/env.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();
  await seedDatabase();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Start listening
  server.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📡 API: http://localhost:${env.PORT}/api/v1`);
    logger.info(`🏥 Health: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });

    // Force close after 30s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });
};

startServer();
