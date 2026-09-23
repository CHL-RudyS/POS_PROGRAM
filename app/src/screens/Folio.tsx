import { useState } from "react";
import { FOLIOS, FOLIO_LABELS, rp, type FolioId } from "../data";
import { useStored } from "../store";
import { Dialog } from "../components/Dialog";

export function Folio() {
  const [tab, setTab] = useStored<FolioId>("folio.tab", "A");
  const [dialog, setDialog] = useState(false);
  const folio = FOLIOS[tab];
  const balance = folio.rows.reduce((a, r) => a + r[3] - r[4], 0);

  return (
    <div className="folio">
      <div className="folio-tabs" role="tablist">
        {(Object.keys(FOLIOS) as FolioId[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={"utab" + (tab === k ? " is-active" : "")} onClick={() => setTab(k)}>
            Folio {k} — {FOLIO_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="folio-head">
        <div>
          <div className="folio-owner">{folio.owner}</div>
          <div className="folio-routing">Routing: {folio.routing}</div>
        </div>
        <div className="folio-balance">
          <div className="kicker">Saldo</div>
          <div className="stat-value">{rp(balance)}</div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr><th>Tanggal</th><th>Kode</th><th>Deskripsi</th><th className="num">Debit</th><th className="num">Kredit</th><th>Oleh</th></tr>
          </thead>
          <tbody>
            {folio.rows.map((r, i) => (
              <tr key={i}>
                <td className="nowrap">{r[0]}</td>
                <td className="folio-code">{r[1]}</td>
                <td>{r[2]}</td>
                <td className="num nowrap">{r[3] ? rp(r[3]) : "—"}</td>
                <td className="num nowrap">{r[4] ? rp(r[4]) : "—"}</td>
                <td className="folio-by">{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row-wrap">
        <button className="btn btn-primary" onClick={() => setDialog(true)}>Posting charge</button>
        <button className="btn btn-secondary">Split bill</button>
        <button className="btn btn-secondary">Transfer ke city ledger</button>
        <button className="btn btn-secondary">Pembayaran</button>
        <button className="btn btn-secondary">Cetak / email invoice</button>
      </div>
      <div className="note">Setiap adjustment, rebate, dan void wajib mencantumkan alasan dan otorisasi supervisor. Semua perubahan tercatat di audit log.</div>

      {dialog && (
        <Dialog title="Posting manual charge" onClose={() => setDialog(false)} actions={<>
          <button className="btn btn-secondary" onClick={() => setDialog(false)}>Batal</button>
          <button className="btn btn-primary" onClick={() => setDialog(false)}>Posting</button>
        </>}>
          <div className="field"><label>Kode charge</label><input className="input" placeholder="mis. FB-RST" autoFocus /></div>
          <div className="field"><label>Jumlah (IDR)</label><input className="input" placeholder="0" inputMode="numeric" /></div>
          <div className="field"><label>Alasan (wajib)</label><input className="input" placeholder="Tulis alasan posting" /></div>
          <div className="note">Butuh otorisasi supervisor untuk nilai di atas Rp 1.000.000.</div>
        </Dialog>
      )}
    </div>
  );
}
