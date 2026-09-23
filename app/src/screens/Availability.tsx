import { CHANNELS, DAYS, ROOM_TYPES, availability, rp } from "../data";
import { useStored } from "../store";

function tone(avail: number) {
  if (avail <= 0) return " tone-0";
  if (avail <= 3) return " tone-3";
  if (avail <= 8) return " tone-8";
  if (avail <= 16) return " tone-16";
  return "";
}

export function Availability() {
  const [sel, setSel] = useStored("avail.sel", { t: 2, d: 3 });
  const selType = ROOM_TYPES[sel.t];
  const selDay = DAYS[sel.d];
  const selAvail = availability(sel.t, selDay);

  return (
    <div className="stack-6">
      <div className="avail-legend">
        <span>Rate plan: <strong>BAR — Best Available Rate</strong></span>
        <span>Periode 12 Sep – 11 Okt 2026</span>
        <span className="avail-legend-scale">Kepadatan
          <i style={{ background: "var(--color-accent-100)" }} />
          <i style={{ background: "var(--color-accent-200)" }} />
          <i style={{ background: "var(--color-accent-300)" }} />
          <i style={{ background: "var(--color-accent-2-200)" }} />
          sold out
        </span>
      </div>

      <div className="avail-scroll">
        <div className="avail-grid">
          <div className="avail-row is-head">
            <div className="avail-type" />
            {DAYS.map((d) => (
              <div key={d.i} className="avail-day">
                <div>{d.dow}</div>
                <b>{d.label}</b>
              </div>
            ))}
          </div>
          {ROOM_TYPES.map((rt, ti) => (
            <div key={rt.code} className="avail-row">
              <div className="avail-type">
                <span>{rt.name}</span>
                <small>{rt.count}</small>
              </div>
              {DAYS.map((d) => {
                const avail = availability(ti, d);
                const picked = sel.t === ti && sel.d === d.i;
                return (
                  <button key={d.i} className={"avail-cell" + tone(avail) + (picked ? " is-picked" : "")}
                    onClick={() => setSel({ t: ti, d: d.i })}
                    aria-label={`${rt.name} ${d.dow} ${d.label} ${d.mon}: ${avail} tersedia`}>
                    {avail}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="avail-info">
        <div>
          <div className="kicker-accent">Sel terpilih</div>
          <h4>{selType.name} · {selDay.dow} {selDay.label} {selDay.mon} 2026</h4>
          <div className="lines-13">
            <div>Tersedia: {selAvail} dari {selType.count} kamar</div>
            <div>Rate: {rp(selDay.weekend ? Math.round(selType.bar * 1.15) : selType.bar)} / malam</div>
            <div>{selAvail <= 3 ? "Min stay 2 malam · Closed to arrival" : "Tidak ada restriction"}</div>
          </div>
          <div className="avail-actions">
            <button className="btn btn-primary btn-sm">Ubah rate</button>
            <button className="btn btn-secondary btn-sm">Stop sell</button>
          </div>
        </div>
        <div>
          <h4 className="h4-sm">Pace booking</h4>
          <p className="body-13">Pick-up 7 hari terakhir 143 room night, 11% di atas periode sama tahun lalu. Akhir pekan 19–20 Sep sudah 94% terjual; sistem menyarankan penutupan Superior King di OTA komisi tinggi.</p>
        </div>
        <div>
          <h4 className="h4-sm">Channel</h4>
          <div className="lines-13">
            {CHANNELS.map((c) => <div key={c}>{c}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
