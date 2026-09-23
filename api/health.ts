import { databaseUrl, db } from "./_lib/db";
import { route } from "./_lib/http";

// GET /api/health — public; confirms the API is deployed and what is configured.
export default route({
  GET: async () => {
    const auth = (process.env.AUTH_SECRET?.length ?? 0) >= 32 ? "configured" : "not_configured";
    if (!databaseUrl()) return { ok: false, database: "not_configured", auth };
    const sql = await db();
    const [{ n }] = await sql`select count(*)::int as n from app_users where active`;
    return { ok: auth === "configured" && n > 0, database: "connected", auth, users: n > 0 ? "present" : "none" };
  },
});
