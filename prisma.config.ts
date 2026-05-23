import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

dotenv.config();

export default defineConfig({
  // earlyAccess: true,
  schema: path.join("prisma", "schema"),
});
