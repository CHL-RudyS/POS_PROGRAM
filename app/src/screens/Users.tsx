import { useCallback, useEffect, useState } from "react";
import { ROLES, ROLE_LABELS, can, type AdminUser, type Role } from "../../../shared/auth";
import { createUser, listUsers, refreshSession, updateUser } from "../api";
import type { ScreenId } from "../data";
import { useSession } from "../session";
import { useStored } from "../store";
import { Dialog } from "../components/Dialog";

const TZ = "Asia/Jakarta";
const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "Belum pernah";

const ROLE_HINTS: Record<Role, string> = {
  cashier: "Menyimpan transaksi POS",
  finance: "Melihat layar Finance dan ekspor CSV",
  supervisor: "POS, Finance, dan void transaksi",
  admin: "Semua akses, termasuk kelola user",
};

const STATUS_FILTERS: [string, string][] = [["", "Semua status"], ["active", "Aktif"], ["inactive", "Nonaktif"], ["locked", "Terkunci"]];

/** 12 characters without look-alikes (0/O, 1/l/I), so it can be read out to the user. */
function randomPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function statusOf(u: AdminUser) {
  if (!u.active) return { label: "Nonaktif", cls: "tag tag-neutral" };
  if (u.locked) return { label: "Terkunci", cls: "tag tag-accent-2" };
  return { label: "Aktif", cls: "tag tag-accent" };
}

export function Users({ onGo }: { onGo: (id: ScreenId) => void }) {
  const me = useSession();
  const allowed = can(me?.role, "manageUsers");
  const [query, setQuery] = useStored("users.query", "");
  const [role, setRole] = useStored<Role | "">("users.role", "");
  const [status, setStatus] = useStored("users.status", "");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers((await listUsers()).users);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (allowed) load(); }, [load, allowed]);

  /** Replace one row after a save, keeping the list order. */
  const upsert = (u: AdminUser) => {
    setUsers((list) => list?.some((x) => x.id === u.id) ? list.map((x) => (x.id === u.id ? u : x)) : [u, ...(list ?? [])]);
    if (u.id === me?.id) refreshSession(); // keep the header name in step
  };

  if (me === undefined) return <div className="muted-12">Memeriksa sesi…</div>;
  if (!allowed) {
    return (
      <div className="fin-error" role="alert">
        {me === null ? (
          <><strong>Silakan login.</strong> Layar User hanya untuk Administrator.{" "}
            <button className="btn btn-ghost btn-sm" onClick={() => onGo("login")}>Masuk</button></>
        ) : (
          <><strong>Akses ditolak.</strong> Layar User hanya untuk Administrator.</>
        )}
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const rows = (users ?? []).filter((u) =>
    (!q || u.name.toLowerCase().includes(q) || u.email.includes(q))
    && (!role || u.role === role)
    && (!status || (status === "active" ? u.active : status === "inactive" ? !u.active : u.active && u.locked)));
  const sel = users?.find((u) => u.id === selId) ?? null;

  return (
    <div className="stack-6">
      <div className="fin-toolbar">
        <div className="branch-search users-search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau email…" aria-label="Cari user" />
        </div>
        <div className="row-wrap">
          {([["", "Semua peran"], ...ROLES.map((r) => [r, ROLE_LABELS[r]])] as [Role | "", string][]).map(([k, label]) => (
            <button key={k} className={"pill pill-sm pill-outline" + (role === k ? " is-active" : "")} aria-pressed={role === k}
              onClick={() => setRole(k)}>{label}</button>
          ))}
        </div>
        <div className="row-wrap">
          {STATUS_FILTERS.map(([k, label]) => (
            <button key={k} className={"pill pill-sm pill-outline" + (status === k ? " is-active" : "")} aria-pressed={status === k}
              onClick={() => setStatus(k)}>{label}</button>
          ))}
        </div>
        <div className="row-wrap fin-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>{loading ? "Memuat…" : "Muat ulang"}</button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>Tambah user</button>
        </div>
      </div>

      {error ? (
        <div className="fin-error" role="alert"><strong>Data tidak dapat dimuat.</strong> {error}</div>
      ) : (
        <>
          <div className="fin-kpis">
            {ROLES.map((r) => (
              <div key={r} className="fin-kpi">
                <div className="kicker">{ROLE_LABELS[r]}</div>
                <div className="stat-value">{users ? users.filter((u) => u.role === r && u.active).length : "—"}</div>
                <div className="muted-12">user aktif</div>
              </div>
            ))}
          </div>

          <div className="fin-body">
            <section className="fin-list">
              <div className="section-head">
                <h4 className="h4-flush">Daftar user</h4>
                <span className="muted-12">{loading ? "Memuat…" : `${rows.length} dari ${users?.length ?? 0} user`}</span>
              </div>
              <div className="table-scroll">
                <table className="table fin-table" style={{ minWidth: 560 }}>
                  <thead><tr><th>Nama</th><th>Peran</th><th>Status</th><th>Login terakhir</th></tr></thead>
                  <tbody>
                    {rows.map((u) => {
                      const st = statusOf(u);
                      return (
                        <tr key={u.id} className={(u.id === selId ? "is-selected" : "") + (!u.active ? " is-inactive" : "")}
                          onClick={() => setSelId(u.id)} tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelId(u.id))}>
                          <td>
                            <div>{u.name}{u.id === me?.id && <span className="users-you"> (Anda)</span>}</div>
                            <div className="fd-guest-sub">{u.email}</div>
                          </td>
                          <td className="nowrap">{ROLE_LABELS[u.role]}</td>
                          <td><span className={st.cls}>{st.label}</span></td>
                          <td className="nowrap muted-12">{when(u.lastLoginAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!loading && rows.length === 0 && <div className="fin-empty">Tidak ada user untuk filter ini.</div>}
            </section>

            <aside className="fin-detail">
              {sel ? (
                <UserEditor key={sel.id} user={sel} isSelf={sel.id === me?.id}
                  onSaved={upsert} onResetPassword={() => setResetting(sel)} />
              ) : (
                <div className="muted-12">Pilih user untuk mengubah nama, peran, status, atau password.</div>
              )}
            </aside>
          </div>
        </>
      )}

      <div className="note">Mengubah peran, menonaktifkan user, atau mengganti password langsung mengeluarkan user itu dari semua perangkat.</div>

      {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={(u) => { upsert(u); setSelId(u.id); }} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} onSaved={upsert} />}
    </div>
  );
}

/* ── Edit panel ────────────────────────────────────────── */

function UserEditor({ user, isSelf, onSaved, onResetPassword }: {
  user: AdminUser; isSelf: boolean; onSaved: (u: AdminUser) => void; onResetPassword: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const changes: { name?: string; role?: Role; active?: boolean } = {};
  if (name.trim() !== user.name) changes.name = name.trim();
  if (role !== user.role) changes.role = role;
  if (active !== user.active) changes.active = active;
  const dirty = Object.keys(changes).length > 0;

  const run = async (patch: Parameters<typeof updateUser>[1], message: string) => {
    setSaving(true);
    setError("");
    setDone("");
    try {
      onSaved(await updateUser(user.id, patch));
      setDone(message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="kicker-accent">{isSelf ? "Akun Anda" : "Ubah user"}</div>
      <div>
        <div className="fin-detail-no">{user.name}</div>
        <div className="muted-12">{user.email}</div>
      </div>
      <div className="lines-13 users-meta">
        <div>Login terakhir: {when(user.lastLoginAt)}</div>
        <div>Dibuat: {when(user.createdAt)}</div>
      </div>

      <div className="field">
        <label htmlFor="user-name">Nama</label>
        <input id="user-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </div>

      <fieldset className="users-roles" disabled={isSelf}>
        <legend className="field-legend">Peran</legend>
        {ROLES.map((r) => (
          <label key={r} className="radio users-role">
            <input type="radio" name="edit-role" value={r} checked={role === r} onChange={() => setRole(r)} />
            <span className="dot" />
            <span><span className="users-role-name">{ROLE_LABELS[r]}</span><span className="users-role-hint">{ROLE_HINTS[r]}</span></span>
          </label>
        ))}
      </fieldset>

      <label className="login-showpass users-active">
        <input type="checkbox" checked={active} disabled={isSelf} onChange={(e) => setActive(e.target.checked)} />
        <span>Akun aktif</span>
      </label>
      {isSelf && <div className="note">Peran dan status akun sendiri tidak bisa diubah, agar admin tidak terkunci dari sistem.</div>}

      <div className="row-wrap">
        <button className="btn btn-primary btn-sm" disabled={!dirty || saving || !name.trim()}
          onClick={() => run(changes, "Perubahan tersimpan.")}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
        {dirty && (
          <button className="btn btn-secondary btn-sm" disabled={saving}
            onClick={() => { setName(user.name); setRole(user.role); setActive(user.active); }}>Batal</button>
        )}
      </div>

      <div className="users-actions">
        <button className="btn btn-secondary btn-sm" onClick={onResetPassword} disabled={saving}>Reset password</button>
        {user.locked && (
          <button className="btn btn-secondary btn-sm" disabled={saving} onClick={() => run({ unlock: true }, "Akun dibuka kembali.")}>Buka kunci</button>
        )}
      </div>
      {user.locked && <div className="note">Akun terkunci 15 menit karena 5 kali salah password.</div>}

      {error && <div className="form-error" role="alert">{error}</div>}
      {done && <div className="pos-saved" role="status">{done}</div>}
    </>
  );
}

/* ── Dialogs ───────────────────────────────────────────── */

function PasswordField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>Password (minimal 8 karakter)</label>
      <div className="users-password">
        <input id={id} className="input" type={show ? "text" : "password"} value={value} autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { onChange(randomPassword()); setShow(true); }}>Buat acak</button>
      </div>
      <label className="login-showpass users-showpass">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <span>Lihat password</span>
      </label>
    </div>
  );
}

/** Shown once after a password is set, so the admin can pass it on. */
function PasswordHandover({ name, password }: { name: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div>Sampaikan password ini ke <strong>{name}</strong>. Password tidak akan ditampilkan lagi.</div>
      <div className="users-handover">
        <code>{password}</code>
        <button className="btn btn-secondary btn-sm" onClick={async () => {
          try { await navigator.clipboard.writeText(password); setCopied(true); } catch { /* clipboard blocked */ }
        }}>{copied ? "Tersalin" : "Salin"}</button>
      </div>
    </>
  );
}

function CreateUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (u: AdminUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("cashier");
  const [password, setPassword] = useState(randomPassword);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<AdminUser | null>(null);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const u = await createUser({ name: name.trim(), email: email.trim(), role, password });
      onCreated(u);
      setCreated(u);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <Dialog title="User dibuat" onClose={onClose} actions={<button className="btn btn-primary" onClick={onClose}>Selesai</button>}>
        <div>{created.name} · {created.email} · {ROLE_LABELS[created.role]}</div>
        <PasswordHandover name={created.name} password={password} />
      </Dialog>
    );
  }

  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 8;
  return (
    <Dialog title="Tambah user" onClose={() => !saving && onClose()} actions={<>
      <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
      <button className="btn btn-primary" onClick={submit} disabled={saving || !valid}>{saving ? "Menyimpan…" : "Tambah user"}</button>
    </>}>
      <div className="field"><label htmlFor="new-name">Nama</label>
        <input id="new-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus /></div>
      <div className="field"><label htmlFor="new-email">Email kantor</label>
        <input id="new-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@ciptaharmoni.com" autoComplete="off" /></div>
      <fieldset className="users-roles">
        <legend className="field-legend">Peran</legend>
        {ROLES.map((r) => (
          <label key={r} className="radio users-role">
            <input type="radio" name="new-role" value={r} checked={role === r} onChange={() => setRole(r)} />
            <span className="dot" />
            <span><span className="users-role-name">{ROLE_LABELS[r]}</span><span className="users-role-hint">{ROLE_HINTS[r]}</span></span>
          </label>
        ))}
      </fieldset>
      <PasswordField id="new-password" value={password} onChange={setPassword} />
      {error && <div className="form-error" role="alert">{error}</div>}
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: (u: AdminUser) => void }) {
  const [password, setPassword] = useState(randomPassword);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      onSaved(await updateUser(user.id, { password }));
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Dialog title="Password diganti" onClose={onClose} actions={<button className="btn btn-primary" onClick={onClose}>Selesai</button>}>
        <PasswordHandover name={user.name} password={password} />
        <div className="note">{user.name} sudah dikeluarkan dari semua perangkat dan harus login dengan password baru.</div>
      </Dialog>
    );
  }

  return (
    <Dialog title={`Reset password — ${user.name}`} onClose={() => !saving && onClose()} actions={<>
      <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
      <button className="btn btn-primary" onClick={submit} disabled={saving || password.length < 8}>{saving ? "Menyimpan…" : "Ganti password"}</button>
    </>}>
      <PasswordField id="reset-password" value={password} onChange={setPassword} />
      <div className="note">Akun juga dibuka jika sedang terkunci.</div>
      {error && <div className="form-error" role="alert">{error}</div>}
    </Dialog>
  );
}
