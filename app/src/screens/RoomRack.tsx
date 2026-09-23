import { RACK, RACK_FILTERS, ST, rackGuest, type RoomStatus } from "../data";
import { useStored } from "../store";

export function RoomRack() {
  const [filter, setFilter] = useStored<(typeof RACK_FILTERS)[number][0]>("rack.filter", "all");
  const [sel, setSel] = useStored<{ no: string; code: RoomStatus }>("rack.sel", { no: "0912", code: "OC" });

  const guest = sel.code === "OC" || sel.code === "OD"
    ? rackGuest(sel.no) + " · check-out 15 Sep"
    : sel.code === "OOO" ? "Work order MTC-0912 — kebocoran AC, target selesai 14 Sep" : "Kosong — siap ditugaskan";

  return (
    <div className="rack">
      <div className="row-wrap">
        {RACK_FILTERS.map(([k, label]) => (
          <button key={k} className={"pill pill-sm pill-outline" + (filter === k ? " is-active" : "")} onClick={() => setFilter(k)}
            aria-pressed={filter === k}>{label}</button>
        ))}
      </div>

      <div className="rack-body">
        <div className="rack-floors">
          {RACK.map((fl) => (
            <div key={fl.floor} className="rack-floor">
              <div className="rack-floor-label">{fl.floor}</div>
              <div className="rack-rooms">
                {fl.rooms.map((r) => {
                  const dim = filter !== "all" && ST[r.code][2] !== filter;
                  return (
                    <button key={r.no} onClick={() => setSel(r)}
                      className={`rack-room ${ST[r.code][1]}` + (dim ? " is-dim" : "") + (sel.no === r.no ? " is-picked" : "")}
                      aria-label={`Kamar ${r.no}, ${ST[r.code][0]}`}>
                      <span className="rack-room-no">{r.no}</span>
                      <span className="rack-room-code">{r.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="rack-side">
          <div>
            <div className="kicker-accent">Kamar terpilih</div>
            <div className="rack-sel-no">{sel.no}</div>
            <div className="rack-sel-status">{sel.code} — {ST[sel.code][0]}</div>
            <div className="rack-sel-guest">{guest}</div>
            <div className="row-wrap rack-sel-actions">
              <button className="btn btn-secondary btn-sm">Ubah status</button>
              <button className="btn btn-secondary btn-sm">Room move</button>
              <button className="btn btn-secondary btn-sm">Work order</button>
            </div>
          </div>
          <div>
            <h4 className="h4-sm">Legenda</h4>
            <div className="rack-legend">
              {(Object.keys(ST) as RoomStatus[]).map((k) => (
                <div key={k} className="rack-legend-row">
                  <span className={`rack-legend-swatch ${ST[k][1]}`} />
                  <span className="rack-legend-code">{k}</span>
                  <span>{ST[k][0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rack-note">Discrepancy report: 1 selisih terbuka (0914). Status kamar diperbarui langsung dari aplikasi room attendant.</div>
        </div>
      </div>
    </div>
  );
}
