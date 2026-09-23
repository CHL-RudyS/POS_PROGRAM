import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Serves the Vercel functions in ../api during `npm run dev`, so the app and
 * its database API run together locally: /api/pos/transactions → api/pos/transactions.ts.
 */
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (!path.startsWith("/api/")) return next();
        const file = repoRoot + path.slice(1) + ".ts";
        if (path.includes("/_") || path.includes("..") || !existsSync(file)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ error: "Endpoint tidak ditemukan" }));
        }
        try {
          const mod = await server.ssrLoadModule(file);
          await mod.default(req, res);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make DATABASE_URL from app/.env.local visible to the API modules in dev.
  const env = loadEnv(mode, process.cwd(), "");
  if (env.DATABASE_URL && !process.env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;

  return {
    plugins: [react(), devApi()],
    base: "./",
    server: { fs: { allow: [repoRoot] } },
  };
});
