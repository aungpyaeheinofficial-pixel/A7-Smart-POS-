import { PrismaClient } from '@prisma/client';
import { getEnv } from '../env.js';

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot-reloading
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: getEnv().NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (getEnv().NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

