import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";

const pgPool = new PgPool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pgPool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
