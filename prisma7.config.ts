import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio, db) uses the direct Neon connection because Prisma
// Migrate needs session-level features that the PgBouncer pooler does not
// provide. The app runtime uses the pooled DATABASE_URL via lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
