/**
 * Prisma Client Singleton
 * Supports Turso (production) and SQLite (development)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Check if we're using Turso (production) - URL starts with libsql:// or https://
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    const adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: authToken,
    });
    // @ts-expect-error - Prisma adapter types
    return new PrismaClient({ adapter });
  }
  
  // Development: Use local SQLite (file:// URL)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
