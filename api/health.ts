import { databaseUrl, db } from "./_lib/db";
import { route } from "./_lib/http";

// GET /api/health — confirms the API is deployed and the database is reachable.
export default route({
  GET: async () => {
    if (!databaseUrl()) return { ok: false, database: "not_configured" };
    const sql = await db();
    await sql`select 1`;
    return { ok: true, database: "connected" };
  },
});
