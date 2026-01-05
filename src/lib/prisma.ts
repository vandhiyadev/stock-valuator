/**
 * Prisma Client Singleton
 * Supports Turso (production) and SQLite (development)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Check if we're using Turso (production) - URL starts with libsql:// or https://
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0]);
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
