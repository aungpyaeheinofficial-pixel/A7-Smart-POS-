import { getEnv } from './env.js';
import { app, logger } from './app.js';
import { prisma } from './db/prisma.js';

const env = getEnv();

/**
 * Start server
 */
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start HTTP server
    // Listen on 0.0.0.0 to accept connections from all network interfaces
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`CORS origin: ${env.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed, database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();

