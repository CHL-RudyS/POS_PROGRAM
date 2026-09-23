import postgres from "postgres";
import { HttpError } from "./http";

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
  });
}

export const SCHEMA = `
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
`;
