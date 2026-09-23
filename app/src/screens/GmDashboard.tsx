import { GM, rp } from "../data";
import { useStored } from "../store";

export function GmDashboard() {
  const [per, setPer] = useStored("gm.period", "Hari ini");
  const d = GM[per];

  return (
    <div className="stack-6">
      <div className="row-wrap">
        {Object.keys(GM).map((k) => (
          <button key={k} className={"pill pill-outline" + (per === k ? " is-active" : "")} onClick={() => setPer(k)}
            aria-pressed={per === k}>{k}</button>
        ))}
      </div>

      <div className="gm-kpis">
        {d.kpis.map(([label, value, delta]) => (
          <div key={label} className="gm-kpi">
            <div className="kicker">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="gm-kpi-delta">{delta}</div>
          </div>
        ))}
      </div>

      <div className="gm-cols">
        <section>
          <h4 className="h4-md">{d.trendLabel}</h4>
          <svg className="gm-chart" viewBox="0 0 364 130" role="img" aria-label="Grafik batang occupancy">
            <line x1="0" y1="120" x2="364" y2="120" stroke="var(--color-divider)" strokeWidth="1" />
            {d.trend.map((v, i) => (
              <rect key={i} x={i * 26} y={Math.round(120 - v * 1.2)} width="18" height={Math.round(v * 1.2)}
                fill={i === d.trend.length - 1 ? "var(--color-accent-2)" : "var(--color-accent-500)"}>
                <title>{v}%</title>
              </rect>
            ))}
          </svg>
          <div className="gm-footnote">Batang magenta adalah periode terakhir. Klik angka agregat untuk drill-down ke transaksi detail.</div>
        </section>

        <section>
          <h4 className="h4-sm">Revenue per departemen</h4>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Departemen</th><th className="num">Revenue</th><th className="num">Porsi</th><th className="num">vs LY</th></tr></thead>
              <tbody>
                {d.depts.map(([name, rev, share, vs]) => (
                  <tr key={name}><td>{name}</td><td className="num nowrap">{rp(rev)}</td><td className="num">{share}</td><td className="num">{vs}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <h4 className="h4-sm">Perbandingan properti — konsolidasi grup</h4>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Properti</th><th className="num">Occ</th><th className="num">ADR</th><th className="num">RevPAR</th><th className="num">RevPAR vs LY</th></tr></thead>
            <tbody>
              {d.props.map(([name, occ, adr, revpar, vs]) => (
                <tr key={name}><td>{name}</td><td className="num">{occ}</td><td className="num nowrap">{rp(adr)}</td><td className="num nowrap">{rp(revpar)}</td><td className="num">{vs}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="gm-footnote">Laporan dijadwalkan otomatis setiap pukul 07:00 ke direksi. Ekspor tersedia dalam Excel, CSV, dan PDF.</div>
      </section>
    </div>
  );
}
