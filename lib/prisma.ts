import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see README).");
  }
  // Runtime queries go through Neon's pooled endpoint; keep the local pool small.
  // Idle connections are kept for a minute because opening one (TLS to Neon) is
  // the slow part; a stalled connect fails after 15s instead of hanging forever.
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse a single client (and its pg pool) across hot reloads in development.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
