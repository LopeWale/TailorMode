import { PrismaClient } from '@prisma/client';

import { env } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClient =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
