import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'npx ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.MASTER_DATABASE_URL || (process.env["MASTER_DATABASE_URL"] ?? ""),
  },
});
