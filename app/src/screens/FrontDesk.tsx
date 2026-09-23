import { ALERTS, ARRIVALS, FD_STATS, type ScreenId } from "../data";
import { startCheckIn } from "./CheckIn";

export function FrontDesk({ onGo }: { onGo: (id: ScreenId) => void }) {
  return (
    <div className="stack-6">
      <div className="fd-stats">
        {FD_STATS.map((s) => (
          <div key={s.label} className={"fd-stat" + (s.accent ? " is-accent" : "")}>
            <div className="kicker">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="muted-12">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="fd-cols">
        <section style={{ minWidth: 0 }}>
          <div className="section-head">
            <h4 className="h4-flush">Arrival list</h4>
            <span className="muted-12">24 belum tiba</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 440 }}>
              <thead>
                <tr><th>Tamu</th><th>Tipe</th><th>Malam</th><th>Kamar</th><th className="num">Aksi</th></tr>
              </thead>
              <tbody>
                {ARRIVALS.map((r) => (
                  <tr key={r.code}>
                    <td>
                      <div className="fd-guest">
                        <span>{r.name}</span>
                        <span className={r.tagClass}>{r.tag}</span>
                      </div>
                      <div className="fd-guest-sub">{r.source} · {r.code}</div>
                    </td>
                    <td className="nowrap">{r.type}</td>
                    <td>{r.nights}</td>
                    <td className="nowrap">{r.room}</td>
                    <td className="num">
                      <button className="btn btn-primary btn-sm" onClick={() => { startCheckIn(r.name); onGo("checkin"); }}>Check-in</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack-6" style={{ minWidth: 0 }}>
          <div>
            <h4 className="h4-sm">Aksi cepat</h4>
            <div className="row-wrap">
              <button className="btn btn-secondary" onClick={() => { startCheckIn("Walk-in guest"); onGo("checkin"); }}>Walk-in</button>
              <button className="btn btn-secondary" onClick={() => onGo("rack")}>Room rack</button>
              <button className="btn btn-secondary" onClick={() => onGo("folio")}>Cari folio</button>
              <button className="btn btn-secondary" onClick={() => onGo("avail")}>Availability</button>
            </div>
            <div className="note" style={{ marginTop: "var(--space-2)" }}>Shortcut: F2 check-in · F3 folio · F4 rack · F8 shift handover</div>
          </div>
          <div>
            <h4 className="h4-sm">Perlu tindakan</h4>
            <div>
              {ALERTS.map((a) => (
                <div key={a.kind} className="fd-alert hairline-row">
                  <span className="fd-alert-kind">{a.kind}</span>
                  <span className="fd-alert-text">{a.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="h4-sm">Catatan shift</h4>
            <p className="body-13" style={{ maxWidth: "44ch" }}>Grup PT Astra Daihatsu (30 kamar, rooming list lengkap) tiba 14:00 dengan dua bus. Master folio B sudah dibuka, semua room charge dirouting ke folio perusahaan.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
