import { PERMISSIONS, ROLE_LABELS } from "../../shared/auth";
import { isRole, requireUser } from "./auth";
import { db } from "./db";
import { HttpError, type ApiRequest } from "./http";
import { hashPassword, validatePassword } from "./passwords";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLUMNS = "id, email, name, role, active, last_login_at as \"lastLoginAt\", created_at as \"createdAt\"";

/** GET /api/admin/users */
export async function listUsers(req: ApiRequest) {
  await requireUser(req, PERMISSIONS.manageUsers);
  const sql = await db();
  return { users: await sql.unsafe(`select ${COLUMNS} from app_users order by active desc, name`) };
}

/** POST /api/admin/users { email, name, role, password } */
export async function createUser(req: ApiRequest) {
  await requireUser(req, PERMISSIONS.manageUsers);
  const b = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, "Email tidak valid");
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 120) throw new HttpError(400, "Nama wajib diisi");
  if (!isRole(b.role)) throw new HttpError(400, `Peran harus salah satu dari: ${Object.keys(ROLE_LABELS).join(", ")}`);
  const password = validatePassword(b.password);

  const sql = await db();
  const [u] = await sql`
    insert into app_users ${sql({ email, name, role: b.role, password_hash: await hashPassword(password) })}
    on conflict (email) do nothing
    returning id`;
  if (!u) throw new HttpError(409, "Email sudah terdaftar");
  const [row] = await sql.unsafe(`select ${COLUMNS} from app_users where id = $1`, [u.id]);
  return row;
}

/** POST /api/admin/user-update { id, name?, role?, active?, password? } — password or deactivation signs the user out everywhere. */
export async function updateUser(req: ApiRequest) {
  const admin = await requireUser(req, PERMISSIONS.manageUsers);
  const b = (req.body ?? {}) as Record<string, unknown>;
  if (!Number.isInteger(b.id)) throw new HttpError(400, "id user tidak valid");
  const id = b.id as number;
  const changes: Record<string, unknown> = {};
  if (b.name !== undefined) {
    if (typeof b.name !== "string" || !b.name.trim() || b.name.length > 120) throw new HttpError(400, "Nama tidak valid");
    changes.name = b.name.trim();
  }
  if (b.role !== undefined) {
    if (!isRole(b.role)) throw new HttpError(400, "Peran tidak valid");
    changes.role = b.role;
  }
  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") throw new HttpError(400, "active harus true/false");
    changes.active = b.active;
  }
  if (b.password !== undefined) changes.password_hash = await hashPassword(validatePassword(b.password));
  if (Object.keys(changes).length === 0) throw new HttpError(400, "Tidak ada perubahan");
  if (id === admin.id && (changes.active === false || (changes.role && changes.role !== "admin"))) {
    throw new HttpError(400, "Anda tidak bisa menonaktifkan atau menurunkan peran akun sendiri");
  }

  const sql = await db();
  const signOut = changes.password_hash !== undefined || changes.active === false || changes.role !== undefined;
  const [u] = await sql`
    update app_users set ${sql(changes)}
      ${signOut ? sql`, session_version = session_version + 1` : sql``}
      ${changes.password_hash ? sql`, failed_logins = 0, locked_until = null` : sql``}
    where id = ${id}
    returning id`;
  if (!u) throw new HttpError(404, "User tidak ditemukan");
  const [row] = await sql.unsafe(`select ${COLUMNS} from app_users where id = $1`, [id]);
  return row;
}
