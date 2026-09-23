import { useState } from "react";
import { DEFAULT_CART, MENU, MENU_PRICE, posTotals, rp, type ScreenId } from "../data";
import { PAYMENT_LABELS, type PaymentMethod, type Transaction } from "../../../shared/pos";
import { saveTransaction } from "../api";
import { useStored } from "../store";
import { Dialog } from "../components/Dialog";

// The design's in-house guest for room 0912; other rooms are not linked to PMS data yet.
const DEMO_GUEST = { roomNo: "0912", name: "Anindya Rahmawati" };

export function PosResto({ onGo }: { onGo: (id: ScreenId) => void }) {
  const [cat, setCat] = useStored("pos.cat", "Makanan");
  const [cart, setCart] = useStored<Record<string, number>>("pos.cart", DEFAULT_CART);
  const [saved, setSaved] = useStored<Transaction | null>("pos.lastSaved", null);
  // clientRef is minted when the dialog opens, so a retried submit cannot create a duplicate bill.
  const [pay, setPay] = useState<{ method: PaymentMethod; clientRef: string } | null>(null);
  const [roomNo, setRoomNo] = useState(DEMO_GUEST.roomNo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lines = Object.keys(cart);
  const totals = posTotals(lines.reduce((a, name) => a + MENU_PRICE[name] * cart[name], 0));
  const add = (name: string) => {
    setCart({ ...cart, [name]: (cart[name] ?? 0) + 1 });
    setSaved(null);
  };
  const minus = (name: string) => {
    const next = { ...cart };
    if (next[name] > 1) next[name] -= 1; else delete next[name];
    setCart(next);
  };

  const openPay = (method: PaymentMethod) => {
    setPay({ method, clientRef: crypto.randomUUID() });
    setError("");
    setRoomNo(DEMO_GUEST.roomNo);
  };
  const closePay = () => { if (!saving) setPay(null); };
  const submit = async () => {
    if (!pay) return;
    setSaving(true);
    setError("");
    try {
      const tx = await saveTransaction({
        clientRef: pay.clientRef,
        method: pay.method,
        items: lines.map((name) => ({ name, qty: cart[name] })),
        roomNo: pay.method === "ROOM" ? roomNo.trim() : undefined,
        guestName: pay.method === "ROOM" && roomNo.trim() === DEMO_GUEST.roomNo ? DEMO_GUEST.name : undefined,
        outlet: "Nusantara Restaurant", tableNo: "12", pax: 2, waiter: "Andi",
      });
      setSaved(tx);
      setCart({});
      setPay(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos">
      <div className="pos-menu">
        <div className="pos-outlet">
          <span className="muted-12">Outlet</span>
          <strong>Nusantara Restaurant</strong>
          <span className="muted-12">Meja 12 · 2 pax · Waiter Andi</span>
        </div>
        <div className="row-wrap">
          {Object.keys(MENU).map((k) => (
            <button key={k} className={"pill pill-surface" + (cat === k ? " is-active" : "")} onClick={() => setCat(k)}
              aria-pressed={cat === k}>{k}</button>
          ))}
        </div>
        <div className="pos-items">
          {MENU[cat].map(([name, price]) => (
            <button key={name} className="pos-item" onClick={() => add(name)}>
              <span className="pos-item-name">{name}</span>
              <span className="pos-item-price">{rp(price)}</span>
            </button>
          ))}
        </div>
        <div className="note">Modifier, set menu, dan happy hour pricing mengikuti konfigurasi outlet. Void dan diskon butuh otorisasi supervisor.</div>
      </div>

      <div className="pos-order">
        <h4 className="h4-flush">Order meja 12</h4>
        {lines.length === 0 && <div className="pos-empty">Belum ada item. Pilih menu di sebelah kiri.</div>}
        <div className="pos-lines">
          {lines.map((name) => (
            <div key={name} className="pos-line hairline-row">
              <span className="pos-line-qty">×{cart[name]}</span>
              <span className="pos-line-name">{name}</span>
              <span className="pos-line-amount">{rp(MENU_PRICE[name] * cart[name])}</span>
              <button className="btn btn-ghost" onClick={() => minus(name)} aria-label={`Kurangi ${name}`}>−</button>
            </div>
          ))}
        </div>
        <div className="pos-sums">
          <div><span>Subtotal</span><span>{rp(totals.sub)}</span></div>
          <div><span>Service charge 11%</span><span>{rp(totals.svc)}</span></div>
          <div><span>PB1 10%</span><span>{rp(totals.tax)}</span></div>
        </div>
        <div className="pos-total">
          <span>Total</span>
          <span className="stat-value">{rp(totals.total)}</span>
        </div>
        <button className="btn btn-primary btn-block" disabled={lines.length === 0} onClick={() => openPay("ROOM")}>Charge to room</button>
        <div className="row-wrap">
          <button className="btn btn-secondary btn-sm" disabled={lines.length === 0} onClick={() => openPay("CASH")}>Tunai</button>
          <button className="btn btn-secondary btn-sm" disabled={lines.length === 0} onClick={() => openPay("QRIS")}>QRIS</button>
          <button className="btn btn-secondary btn-sm" disabled={lines.length === 0} onClick={() => openPay("CARD")}>Kartu</button>
          <button className="btn btn-secondary btn-sm">Split bill</button>
        </div>
        {saved && (
          <div className="pos-saved" role="status">
            <div>Tersimpan <strong>{saved.no}</strong> · {PAYMENT_LABELS[saved.method]}{saved.roomNo ? ` ${saved.roomNo}` : ""} · {rp(saved.total)}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onGo("finance")}>Lihat di Finance</button>
          </div>
        )}
      </div>

      {pay && (
        <Dialog title={pay.method === "ROOM" ? "Charge to room" : `Pembayaran ${PAYMENT_LABELS[pay.method]}`} onClose={closePay} actions={<>
          <button className="btn btn-secondary" onClick={closePay} disabled={saving}>Batal</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || (pay.method === "ROOM" && !roomNo.trim())}>
            {saving ? "Menyimpan…" : pay.method === "ROOM" ? "Posting ke folio" : "Simpan transaksi"}
          </button>
        </>}>
          {pay.method === "ROOM" ? (
            <>
              <div className="field"><label htmlFor="pos-room">Nomor kamar</label>
                <input id="pos-room" className="input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} inputMode="numeric" autoFocus /></div>
              {roomNo.trim() === DEMO_GUEST.roomNo ? (
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div>{DEMO_GUEST.name} · in-house sampai 15 Sep</div>
                  <div style={{ color: "var(--color-accent-700)" }}>Credit limit tersisa Rp 4.820.000 — cukup</div>
                  <div style={{ color: "var(--color-neutral-700)" }}>Routing: F&amp;B tetap di folio A (tamu)</div>
                </div>
              ) : (
                <div className="note">Data tamu kamar ini belum terhubung ke PMS — charge tetap dicatat dengan nomor kamar.</div>
              )}
              <div className="field"><label>Tanda tangan tamu</label><div className="dialog-sign" /></div>
            </>
          ) : (
            <div className="pos-sums">
              <div><span>Meja 12 · {lines.length} item</span><span>{rp(totals.total)}</span></div>
              <div className="note">Pastikan pembayaran {PAYMENT_LABELS[pay.method]} sudah diterima sebelum menyimpan.</div>
            </div>
          )}
          {error && <div className="form-error" role="alert">{error}</div>}
        </Dialog>
      )}
    </div>
  );
}
