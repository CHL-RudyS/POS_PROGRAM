import { useState } from "react";
import { DEFAULT_CART, MENU, MENU_PRICE, posTotals, rp } from "../data";
import { useStored } from "../store";
import { Dialog } from "../components/Dialog";

export function PosResto() {
  const [cat, setCat] = useStored("pos.cat", "Makanan");
  const [cart, setCart] = useStored<Record<string, number>>("pos.cart", DEFAULT_CART);
  const [dialog, setDialog] = useState(false);

  const lines = Object.keys(cart);
  const totals = posTotals(lines.reduce((a, name) => a + MENU_PRICE[name] * cart[name], 0));
  const add = (name: string) => setCart({ ...cart, [name]: (cart[name] ?? 0) + 1 });
  const minus = (name: string) => {
    const next = { ...cart };
    if (next[name] > 1) next[name] -= 1; else delete next[name];
    setCart(next);
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
        <button className="btn btn-primary btn-block" onClick={() => setDialog(true)}>Charge to room</button>
        <div className="row-wrap">
          <button className="btn btn-secondary btn-sm">Tunai</button>
          <button className="btn btn-secondary btn-sm">QRIS</button>
          <button className="btn btn-secondary btn-sm">Kartu</button>
          <button className="btn btn-secondary btn-sm">Split bill</button>
        </div>
      </div>

      {dialog && (
        <Dialog title="Charge to room" onClose={() => setDialog(false)} actions={<>
          <button className="btn btn-secondary" onClick={() => setDialog(false)}>Batal</button>
          <button className="btn btn-primary" onClick={() => { setDialog(false); setCart({}); }}>Posting ke folio</button>
        </>}>
          <div className="field"><label>Nomor kamar</label><input className="input" defaultValue="0912" autoFocus /></div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <div>Anindya Rahmawati · in-house sampai 15 Sep</div>
            <div style={{ color: "var(--color-accent-700)" }}>Credit limit tersisa Rp 4.820.000 — cukup</div>
            <div style={{ color: "var(--color-neutral-700)" }}>Routing: F&amp;B tetap di folio A (tamu)</div>
          </div>
          <div className="field"><label>Tanda tangan tamu</label><div className="dialog-sign" /></div>
        </Dialog>
      )}
    </div>
  );
}
