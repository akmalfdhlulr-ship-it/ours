import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export * from "@prisma/client";

/**
 * Factory to create a PrismaClient with the pg pool adapter when DATABASE_URL is present.
 */
export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): {
  client: PrismaClient;
  pool?: Pool;
} {
  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    return { client, pool };
  }
  return { client: new PrismaClient() };
}

const globalForPrisma = global as unknown as { prisma: PrismaClient; prismaPool?: Pool };

const defaultSetup = globalForPrisma.prisma
  ? { client: globalForPrisma.prisma, pool: globalForPrisma.prismaPool }
  : createPrismaClient();

export const prisma = defaultSetup.client;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = defaultSetup.pool;
}

export default prisma;

/**
 * PrismaService for NestJS Dependency Injection.
 * Handles lifecycle events and health check queries.
 */
export class PrismaService extends PrismaClient {
  private poolInstance?: Pool;

  constructor(databaseUrl = process.env.DATABASE_URL) {
    if (databaseUrl) {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      super({ adapter });
      this.poolInstance = pool;
    } else {
      super();
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch {
      // Do not throw unhandled exception to allow API to boot into unhealthy state rather than crash loop
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (this.poolInstance) {
      await this.poolInstance.end();
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[PrismaService] Database health check query failed: ${message}`);
      }
      return false;
    }
  }
}
