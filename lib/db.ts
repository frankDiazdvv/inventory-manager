// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // 1. Initialize a native Node-Postgres connection pool using your .env string
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 2. Wrap it inside the mandatory Prisma 7 driver adapter
  const adapter = new PrismaPg(pool);
  
  // 3. Pass the adapter to the Client constructor
  prismaInstance = new PrismaClient({ adapter });
}

export const db = prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;