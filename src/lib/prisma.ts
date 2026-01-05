// @ts-nocheck
/**
 * Prisma Client Singleton
 * For production with Turso
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as { prisma?: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Use Turso for production
  if (databaseUrl && databaseUrl.includes('turso.io')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  // Local development with file SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
