import type postgres from "postgres";
import {
  MENU_PRICE, PAYMENT_METHODS, posTotals,
  type PaymentMethod, type Transaction, type TransactionSummary,
} from "../../shared/pos";
import { db } from "./db";
import { HttpError, type ApiRequest } from "./http";

const TZ = "Asia/Jakarta";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isMethod(v: unknown): v is PaymentMethod {
  return typeof v === "string" && (PAYMENT_METHODS as readonly string[]).includes(v);
}

function text(v: unknown, field: string, max: number, fallback?: string): string {
  if (v === undefined || v === null || v === "") {
    if (fallback !== undefined) return fallback;
    throw new HttpError(400, `${field} wajib diisi`);
  }
  if (typeof v !== "string" || v.trim().length > max) throw new HttpError(400, `${field} tidak valid`);
  return v.trim();
}

/** Today's date in Jakarta, YYYY-MM-DD. */
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

const SELECT = (sql: postgres.Sql) => sql`
  select
    t.id, t.created_at, t.outlet, t.table_no, t.pax, t.waiter, t.method, t.room_no, t.guest_name,
    t.subtotal, t.service, t.tax, t.total, t.status, t.void_reason, t.voided_at,
    'POS-' || to_char(t.created_at at time zone ${TZ}, 'YYMMDD') || '-' || lpad(t.id::text, 5, '0') as no,
    (select coalesce(json_agg(json_build_object('name', i.name, 'qty', i.qty, 'price', i.price, 'amount', i.amount)
                              order by i.line_no), '[]'::json)
       from pos_transaction_items i where i.transaction_id = t.id) as items
  from pos_transactions t`;

type Row = Record<string, unknown>;

function toTransaction(r: Row): Transaction {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v === null ? null : String(v));
  return {
    id: r.id as number, no: r.no as string, createdAt: iso(r.created_at)!,
    outlet: r.outlet as string, tableNo: r.table_no as string, pax: r.pax as number, waiter: r.waiter as string,
    method: r.method as PaymentMethod, roomNo: r.room_no as string | null, guestName: r.guest_name as string | null,
    subtotal: r.subtotal as number, service: r.service as number, tax: r.tax as number, total: r.total as number,
    status: r.status as Transaction["status"], voidReason: r.void_reason as string | null, voidedAt: iso(r.voided_at),
    items: r.items as Transaction["items"],
  };
}

async function byId(sql: postgres.Sql, id: number) {
  const [row] = await sql`${SELECT(sql)} where t.id = ${id}`;
  if (!row) throw new HttpError(404, "Transaksi tidak ditemukan");
  return toTransaction(row);
}

/** POST /api/pos/transactions — store a paid or room-charged POS bill. Idempotent on clientRef. */
export async function createTransaction({ body }: ApiRequest): Promise<Transaction> {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.clientRef !== "string" || !UUID.test(b.clientRef)) throw new HttpError(400, "clientRef harus UUID");
  if (!isMethod(b.method)) throw new HttpError(400, "Metode pembayaran tidak valid");
  if (!Array.isArray(b.items) || b.items.length === 0) throw new HttpError(400, "Order masih kosong");
  if (b.items.length > 100) throw new HttpError(400, "Terlalu banyak item");

  const lines = b.items.map((it: unknown, i) => {
    const { name, qty } = (it ?? {}) as Record<string, unknown>;
    if (typeof name !== "string" || !(name in MENU_PRICE)) throw new HttpError(400, `Item #${i + 1} tidak ada di menu`);
    if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > 99) throw new HttpError(400, `Jumlah item "${name}" tidak valid`);
    const price = MENU_PRICE[name];
    return { line_no: i + 1, name, qty: qty as number, price, amount: price * (qty as number) };
  });

  const method = b.method;
  const roomNo = method === "ROOM" ? text(b.roomNo, "Nomor kamar", 10) : null;
  if (roomNo !== null && !/^\d{3,4}$/.test(roomNo)) throw new HttpError(400, "Nomor kamar harus 3–4 digit");
  const pax = b.pax === undefined ? 2 : b.pax;
  if (!Number.isInteger(pax) || (pax as number) < 1 || (pax as number) > 99) throw new HttpError(400, "Jumlah pax tidak valid");

  const totals = posTotals(lines.reduce((a, l) => a + l.amount, 0));
  const sql = await db();
  // Replays of an already-saved request return the stored bill without touching
  // the identity sequence, so transaction numbers stay gap-free.
  const [existing] = await sql`select id from pos_transactions where client_ref = ${b.clientRef as string}`;
  if (existing) return byId(sql, existing.id as number);

  const id = await sql.begin(async (tx) => {
    const [row] = await tx`
      insert into pos_transactions ${tx({
        client_ref: b.clientRef as string,
        outlet: text(b.outlet, "Outlet", 80, "Nusantara Restaurant"),
        table_no: text(b.tableNo, "Meja", 20, "12"),
        pax: pax as number,
        waiter: text(b.waiter, "Waiter", 80, "Andi"),
        method,
        room_no: roomNo,
        guest_name: b.guestName ? text(b.guestName, "Nama tamu", 120) : null,
        subtotal: totals.sub, service: totals.svc, tax: totals.tax, total: totals.total,
      })}
      on conflict (client_ref) do nothing
      returning id`;
    if (!row) {
      // Lost a race with a concurrent retry of the same request.
      const [dup] = await tx`select id from pos_transactions where client_ref = ${b.clientRef as string}`;
      return dup.id as number;
    }
    await tx`insert into pos_transaction_items ${tx(lines.map((l) => ({ transaction_id: row.id, ...l })))}`;
    return row.id as number;
  });
  return byId(sql, id);
}

/** GET /api/pos/transactions?date=YYYY-MM-DD&method=&status= — one business day, newest first. */
export async function listTransactions({ query }: ApiRequest) {
  const date = query.get("date") || today();
  if (!DATE.test(date)) throw new HttpError(400, "Format tanggal harus YYYY-MM-DD");
  const method = query.get("method");
  if (method && !isMethod(method)) throw new HttpError(400, "Metode pembayaran tidak valid");
  const status = query.get("status");
  if (status && status !== "posted" && status !== "void") throw new HttpError(400, "Status tidak valid");

  const sql = await db();
  const onDate = sql`(t.created_at at time zone ${TZ})::date = ${date}::date`;
  const rows = await sql`
    ${SELECT(sql)}
    where ${onDate}
      ${method ? sql`and t.method = ${method}` : sql``}
      ${status ? sql`and t.status = ${status}` : sql``}
    order by t.created_at desc, t.id desc
    limit 500`;

  const groups = await sql`
    select t.method, t.status, count(*)::int as count, coalesce(sum(t.total), 0)::float8 as total
    from pos_transactions t where ${onDate}
    group by t.method, t.status`;

  const summary: TransactionSummary = {
    count: 0, total: 0, voidCount: 0,
    byMethod: Object.fromEntries(PAYMENT_METHODS.map((m) => [m, { count: 0, total: 0 }])) as TransactionSummary["byMethod"],
  };
  for (const g of groups) {
    if (g.status === "void") { summary.voidCount += g.count; continue; }
    summary.count += g.count;
    summary.total += g.total;
    summary.byMethod[g.method as PaymentMethod].count += g.count;
    summary.byMethod[g.method as PaymentMethod].total += g.total;
  }

  return { date, transactions: rows.map(toTransaction), summary };
}

/** POST /api/pos/void { id, reason } — void a posted bill; the row is kept for audit. */
export async function voidTransaction({ body }: ApiRequest): Promise<Transaction> {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!Number.isInteger(b.id)) throw new HttpError(400, "id transaksi tidak valid");
  const reason = text(b.reason, "Alasan void", 200);
  if (reason.length < 3) throw new HttpError(400, "Alasan void minimal 3 karakter");

  const sql = await db();
  const [row] = await sql`
    update pos_transactions set status = 'void', void_reason = ${reason}, voided_at = now()
    where id = ${b.id as number} and status = 'posted'
    returning id`;
  if (!row) {
    const current = await byId(sql, b.id as number); // 404 if missing
    if (current.status === "void") throw new HttpError(409, "Transaksi sudah di-void");
  }
  return byId(sql, b.id as number);
}
