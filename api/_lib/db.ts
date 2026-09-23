import postgres from "postgres";
import { HttpError } from "./http";
import { hashPassword } from "./passwords";

// One connection per serverless instance; prepare:false keeps it compatible
// with transaction-mode poolers (Neon / Supabase pooled URLs).
let sql: postgres.Sql | undefined;
let migrated: Promise<void> | undefined;

export function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

export async function db() {
  const url = databaseUrl();
  if (!url) throw new HttpError(503, "Database belum dikonfigurasi — set DATABASE_URL di Environment Variables Vercel.");
  sql ??= postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  migrated ??= migrate(sql).catch((err) => {
    migrated = undefined;
    throw err;
  });
  await migrated;
  return sql;
}

/** Creates the POS tables on first use. Idempotent; the advisory lock stops concurrent cold starts racing. */
async function migrate(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(727001)`;
    await tx.unsafe(SCHEMA);
    await bootstrapAdmin(tx);
  });
}

/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD while the users table is empty. */
async function bootstrapAdmin(tx: postgres.TransactionSql) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) return;
  const [{ n }] = await tx`select count(*)::int as n from app_users`;
  if (n > 0) return;
  await tx`insert into app_users ${tx({
    email, name: process.env.ADMIN_NAME?.trim() || "Administrator", role: "admin",
    password_hash: await hashPassword(password),
  })}`;
}

export const SCHEMA = `
create table if not exists app_users (
  id              integer generated always as identity primary key,
  email           text not null unique check (email = lower(email)),
  name            text not null,
  role            text not null check (role in ('cashier', 'finance', 'supervisor', 'admin')),
  password_hash   text not null,
  active          boolean not null default true,
  session_version integer not null default 1,
  failed_logins   integer not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists pos_transactions (
  id          integer generated always as identity primary key,
  client_ref  uuid not null unique,
  created_at  timestamptz not null default now(),
  outlet      text not null,
  table_no    text not null,
  pax         integer not null check (pax between 1 and 99),
  waiter      text not null,
  method      text not null check (method in ('ROOM', 'CASH', 'QRIS', 'CARD')),
  room_no     text,
  guest_name  text,
  subtotal    integer not null,
  service     integer not null,
  tax         integer not null,
  total       integer not null,
  status      text not null default 'posted' check (status in ('posted', 'void')),
  void_reason text,
  voided_at   timestamptz,
  check (method <> 'ROOM' or room_no is not null)
);
create index if not exists pos_transactions_created_at_idx on pos_transactions (created_at desc);

create table if not exists pos_transaction_items (
  id             integer generated always as identity primary key,
  transaction_id integer not null references pos_transactions (id) on delete cascade,
  line_no        integer not null,
  name           text not null,
  qty            integer not null check (qty > 0),
  price          integer not null,
  amount         integer not null
);
create index if not exists pos_transaction_items_tx_idx on pos_transaction_items (transaction_id);

-- Audit: who saved and who voided each bill (added with login; null for older rows).
alter table pos_transactions add column if not exists created_by integer references app_users (id);
alter table pos_transactions add column if not exists voided_by integer references app_users (id);
`;
