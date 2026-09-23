import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type postgres from "postgres";
import { ROLES, type Role, type SessionUser } from "../../shared/auth";
import { db } from "./db";
import { HttpError, type ApiRequest } from "./http";
import { hashPassword, verifyPassword } from "./passwords";

export const COOKIE = "ho_session";
const SESSION_HOURS = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

// Hash of a random string, verified against when the email is unknown so the
// response time does not reveal which emails exist.
let dummyHash: Promise<string> | undefined;

/* ── Session tokens ────────────────────────────────────── */

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new HttpError(503, "Login belum dikonfigurasi — set AUTH_SECRET (minimal 32 karakter) di Environment Variables Vercel.");
  }
  return s;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

interface TokenPayload { uid: number; sv: number; exp: number }

function issueToken(uid: number, sv: number) {
  const payload = b64url(JSON.stringify({ uid, sv, exp: Date.now() + SESSION_HOURS * 3600_000 } satisfies TokenPayload));
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString()) as TokenPayload;
    return Number.isInteger(p.uid) && Number.isInteger(p.sv) && p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

function sessionCookie(value: string, maxAgeSeconds: number) {
  return `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/* ── Users ─────────────────────────────────────────────── */

type UserRow = { id: number; email: string; name: string; role: Role; active: boolean; session_version: number };

export const toSessionUser = (u: UserRow): SessionUser => ({ id: u.id, email: u.email, name: u.name, role: u.role });

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

/**
 * Returns the signed-in user, or throws 401/403. Every call re-reads the user,
 * so deactivating an account or changing its password ends its sessions at once.
 */
export async function requireUser(req: ApiRequest, roles?: readonly Role[]): Promise<SessionUser> {
  secret(); // fail with 503 before anything else when auth is not configured
  const token = readToken(req.cookies[COOKIE]);
  if (!token) throw new HttpError(401, "Silakan login terlebih dahulu");
  const sql = await db();
  const [u] = await sql<UserRow[]>`
    select id, email, name, role, active, session_version from app_users where id = ${token.uid}`;
  if (!u || !u.active || u.session_version !== token.sv) throw new HttpError(401, "Sesi berakhir — silakan login kembali");
  if (roles && !roles.includes(u.role)) throw new HttpError(403, "Peran Anda tidak memiliki akses ke fitur ini");
  return toSessionUser(u);
}

/** POST /api/auth/login { email, password } */
export async function login(req: ApiRequest): Promise<SessionUser> {
  secret();
  const b = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) throw new HttpError(400, "Email dan kata sandi wajib diisi");

  const sql = await db();
  const [u] = await sql<(UserRow & { password_hash: string; locked: boolean })[]>`
    select id, email, name, role, active, session_version, password_hash,
           coalesce(locked_until > now(), false) as locked
    from app_users where email = ${email}`;

  if (!u) {
    dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummyHash);
    throw new HttpError(401, "Email atau kata sandi salah");
  }
  if (u.locked) throw new HttpError(429, `Terlalu banyak percobaan gagal. Coba lagi dalam ${LOCK_MINUTES} menit.`);

  const ok = await verifyPassword(password, u.password_hash);
  if (!ok || !u.active) {
    if (!ok) await recordFailure(sql, u.id);
    throw new HttpError(401, ok ? "Akun dinonaktifkan — hubungi Admin" : "Email atau kata sandi salah");
  }

  await sql`update app_users set failed_logins = 0, locked_until = null, last_login_at = now() where id = ${u.id}`;
  req.setCookie(sessionCookie(issueToken(u.id, u.session_version), SESSION_HOURS * 3600));
  return toSessionUser(u);
}

async function recordFailure(sql: postgres.Sql, id: number) {
  await sql`
    update app_users set
      failed_logins = case when failed_logins + 1 >= ${MAX_FAILED} then 0 else failed_logins + 1 end,
      locked_until  = case when failed_logins + 1 >= ${MAX_FAILED}
                           then now() + make_interval(mins => ${LOCK_MINUTES}) else locked_until end
    where id = ${id}`;
}

/** POST /api/auth/logout */
export async function logout(req: ApiRequest) {
  req.setCookie(sessionCookie("", 0));
  return { ok: true };
}

/** GET /api/auth/me */
export async function me(req: ApiRequest) {
  return requireUser(req);
}
