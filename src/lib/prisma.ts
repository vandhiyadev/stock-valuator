/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Prisma Client Singleton
 * Supports Turso (production) and SQLite (development)
 */

import { PrismaClient } from '@prisma/client';

// Dynamic imports for production Turso adapter
let PrismaLibSQL: typeof import('@prisma/adapter-libsql').PrismaLibSQL | null = null;
let createClient: typeof import('@libsql/client').createClient | null = null;

// Load adapter dynamically only when needed
async function loadTursoAdapter() {
  if (!PrismaLibSQL) {
    const adapterModule = await import('@prisma/adapter-libsql');
    PrismaLibSQL = adapterModule.PrismaLibSQL;
  }
  if (!createClient) {
    const clientModule = await import('@libsql/client');
    createClient = clientModule.createClient;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Use Turso for production (libsql:// URLs)  
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    // For Turso, use synchronous require to avoid async initialization issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaLibSQL: LibSQL } = require('@prisma/adapter-libsql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient: create } = require('@libsql/client');
    
    const libsql = create({
      url: databaseUrl,
      authToken: authToken,
    });
    
    const adapter = new LibSQL(libsql);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({ adapter } as any);
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

// Export async loader for use in edge routes if needed
export { loadTursoAdapter };
