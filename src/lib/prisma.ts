/**
 * Prisma Client Singleton
 * For production with Turso
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Use Turso for production
  if (databaseUrl && databaseUrl.includes('turso.io')) {
    console.log('Using Turso database');
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({ adapter } as any);
  }
  
  // Local development with file SQLite
  console.log('Using local SQLite database');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
