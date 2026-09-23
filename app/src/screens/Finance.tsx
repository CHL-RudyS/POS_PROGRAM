import { useCallback, useEffect, useState } from "react";
import { PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethod, type Transaction } from "../../../shared/pos";
import { listTransactions, voidTransaction, type TransactionList } from "../api";
import { rp, type ScreenId } from "../data";
import { can } from "../../../shared/auth";
import { useSession } from "../session";
import { useStored } from "../store";
import { Dialog } from "../components/Dialog";

const TZ = "Asia/Jakarta";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const time = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const METHOD_FILTERS: [PaymentMethod | "", string][] = [["", "Semua metode"], ...PAYMENT_METHODS.map((m) => [m, PAYMENT_LABELS[m]] as [PaymentMethod, string])];
const STATUS_FILTERS: [string, string][] = [["", "Semua status"], ["posted", "Posted"], ["void", "Void"]];

export function Finance({ onGo }: { onGo: (id: ScreenId) => void }) {
  const user = useSession();
  const allowed = can(user?.role, "viewFinance");
  const [date, setDate] = useStored("finance.date", today());
  const [method, setMethod] = useStored<PaymentMethod | "">("finance.method", "");
  const [status, setStatus] = useStored("finance.status", "");
  const [data, setData] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [voiding, setVoiding] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listTransactions({ date, method, status }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [date, method, status]);

  useEffect(() => { if (allowed) load(); }, [load, allowed]);

  const rows = data?.transactions ?? [];
  const sel = rows.find((t) => t.id === selId) ?? null;
  const s = data?.summary;

  if (user === undefined) return <div className="muted-12">Memeriksa sesi…</div>;
  if (!allowed) {
    return (
      <div className="fin-error" role="alert">
        {user === null ? (
          <><strong>Silakan login.</strong> Layar Finance hanya untuk peran Finance, Supervisor, dan Administrator.{" "}
            <button className="btn btn-ghost btn-sm" onClick={() => onGo("login")}>Masuk</button></>
        ) : (
          <><strong>Akses ditolak.</strong> Layar Finance hanya untuk peran Finance, Supervisor, dan Administrator.</>
        )}
      </div>
    );
  }

  return (
    <div className="stack-6">
      <div className="fin-toolbar">
        <label className="fin-date">
          <span className="kicker">Tanggal</span>
          <input type="date" className="input" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <div className="row-wrap">
          {METHOD_FILTERS.map(([k, label]) => (
            <button key={k} className={"pill pill-sm pill-outline" + (method === k ? " is-active" : "")} aria-pressed={method === k}
              onClick={() => setMethod(k)}>{label}</button>
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
          <button className="btn btn-secondary btn-sm" onClick={() => exportCsv(date, rows)} disabled={rows.length === 0}>Ekspor CSV</button>
        </div>
      </div>

      {error ? (
        <div className="fin-error" role="alert">
          <strong>Data tidak dapat dimuat.</strong> {error}
        </div>
      ) : (
        <>
          <div className="fin-kpis">
            <div className="fin-kpi is-accent">
              <div className="kicker">Total penjualan</div>
              <div className="stat-value">{s ? rp(s.total) : "—"}</div>
              <div className="muted-12">{s ? `${s.count} transaksi posted` : " "}</div>
            </div>
            {PAYMENT_METHODS.map((m) => (
              <div key={m} className="fin-kpi">
                <div className="kicker">{PAYMENT_LABELS[m]}</div>
                <div className="stat-value">{s ? rp(s.byMethod[m].total) : "—"}</div>
                <div className="muted-12">{s ? `${s.byMethod[m].count} transaksi` : " "}</div>
              </div>
            ))}
            <div className="fin-kpi">
              <div className="kicker">Void</div>
              <div className="stat-value">{s ? s.voidCount : "—"}</div>
              <div className="muted-12">tidak dihitung di total</div>
            </div>
          </div>

          <div className="fin-body">
            <section className="fin-list">
              <div className="section-head">
                <h4 className="h4-flush">Transaksi POS</h4>
                <span className="muted-12">{loading ? "Memuat…" : `${rows.length} baris`}</span>
              </div>
              <div className="table-scroll">
                <table className="table fin-table" style={{ minWidth: 640 }}>
                  <thead>
                    <tr><th>No.</th><th>Waktu</th><th>Outlet</th><th>Metode</th><th>Kamar</th><th className="num">Total</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id} className={(t.id === selId ? "is-selected" : "") + (t.status === "void" ? " is-void" : "")}
                        onClick={() => setSelId(t.id)} tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelId(t.id))}>
                        <td className="nowrap fin-no">{t.no}</td>
                        <td className="nowrap">{time(t.createdAt)}</td>
                        <td>{t.outlet} · Meja {t.tableNo}</td>
                        <td className="nowrap">{PAYMENT_LABELS[t.method]}</td>
                        <td>{t.roomNo ?? "—"}</td>
                        <td className="num nowrap">{rp(t.total)}</td>
                        <td><span className={t.status === "void" ? "tag tag-accent-2" : "tag tag-accent"}>{t.status === "void" ? "Void" : "Posted"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && rows.length === 0 && (
                <div className="fin-empty">Belum ada transaksi untuk filter ini. Transaksi muncul di sini setelah kasir menyimpan pembayaran di layar 02F FD - POS Resto.</div>
              )}
            </section>

            <aside className="fin-detail">
              {sel ? (
                <>
                  <div className="kicker-accent">Detail transaksi</div>
                  <div className="fin-detail-no">{sel.no}</div>
                  <div className="lines-13">
                    <div>{new Intl.DateTimeFormat("id-ID", { timeZone: TZ, dateStyle: "long", timeStyle: "short" }).format(new Date(sel.createdAt))} WIB</div>
                    <div>{sel.outlet} · Meja {sel.tableNo} · {sel.pax} pax · Waiter {sel.waiter}</div>
                    <div>{PAYMENT_LABELS[sel.method]}{sel.roomNo ? ` · Kamar ${sel.roomNo}` : ""}{sel.guestName ? ` · ${sel.guestName}` : ""}</div>
                    {sel.createdBy && <div>Disimpan oleh {sel.createdBy}</div>}
                  </div>
                  <div className="pos-lines">
                    {sel.items.map((it) => (
                      <div key={it.name} className="pos-line hairline-row">
                        <span className="pos-line-qty">×{it.qty}</span>
                        <span className="pos-line-name">{it.name}</span>
                        <span className="pos-line-amount">{rp(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pos-sums">
                    <div><span>Subtotal</span><span>{rp(sel.subtotal)}</span></div>
                    <div><span>Service charge 11%</span><span>{rp(sel.service)}</span></div>
                    <div><span>PB1 10%</span><span>{rp(sel.tax)}</span></div>
                  </div>
                  <div className="pos-total">
                    <span>Total</span>
                    <span className="stat-value">{rp(sel.total)}</span>
                  </div>
                  {sel.status === "void" ? (
                    <div className="fin-void-note">Di-void {sel.voidedAt ? time(sel.voidedAt) : ""}{sel.voidedBy ? ` oleh ${sel.voidedBy}` : ""} — {sel.voidReason}</div>
                  ) : can(user?.role, "voidTransaction") ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => setVoiding(sel)}>Void transaksi</button>
                  ) : (
                    <div className="note">Void hanya bisa dilakukan Supervisor.</div>
                  )}
                </>
              ) : (
                <div className="muted-12">Pilih baris untuk melihat item dan rincian pajak.</div>
              )}
            </aside>
          </div>
        </>
      )}

      <div className="note">Data tersimpan di database Postgres. Void tidak menghapus transaksi — baris tetap ada dengan alasan dan waktu void untuk audit.</div>

      {voiding && <VoidDialog tx={voiding} onClose={() => setVoiding(null)} onDone={() => { setVoiding(null); load(); }} />}
    </div>
  );
}

function VoidDialog({ tx, onClose, onDone }: { tx: Transaction; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await voidTransaction(tx.id, reason.trim());
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };
  return (
    <Dialog title={`Void ${tx.no}`} onClose={() => !saving && onClose()} actions={<>
      <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
      <button className="btn btn-primary" onClick={submit} disabled={saving || reason.trim().length < 3}>{saving ? "Menyimpan…" : "Void"}</button>
    </>}>
      <div>{PAYMENT_LABELS[tx.method]} · {rp(tx.total)}</div>
      <div className="field"><label htmlFor="void-reason">Alasan (wajib)</label>
        <input id="void-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200}
          placeholder="mis. salah input meja" autoFocus /></div>
      <div className="note">Void dicatat atas nama Anda. Transaksi tetap tersimpan untuk audit.</div>
      {error && <div className="form-error" role="alert">{error}</div>}
    </Dialog>
  );
}

function exportCsv(date: string, rows: Transaction[]) {
  const head = ["No", "Waktu", "Outlet", "Meja", "Pax", "Waiter", "Metode", "Kamar", "Tamu", "Subtotal", "Service", "PB1", "Total", "Status", "Alasan void", "Disimpan oleh", "Void oleh", "Item"];
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((t) => [
    t.no, time(t.createdAt), t.outlet, t.tableNo, t.pax, t.waiter, PAYMENT_LABELS[t.method], t.roomNo, t.guestName,
    t.subtotal, t.service, t.tax, t.total, t.status, t.voidReason, t.createdBy, t.voidedBy, t.items.map((i) => `${i.qty}x ${i.name}`).join(", "),
  ].map(cell).join(";"));
  // Semicolons + BOM so Excel with Indonesian regional settings opens it in columns.
  const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pos-transaksi-${date}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
