// lib/prisma.ts - Singleton de Prisma Client (Patrón de diseño para PgBouncer/Supabase en Next.js)
// Mitiga el BUG-01 e IMP-01 (Error: remaining connection slots are reserved)

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
