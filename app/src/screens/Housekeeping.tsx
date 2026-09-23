import { HK_ACTION, HK_NEXT, HK_TASKS, ST, type HkStatus } from "../data";
import { useStored } from "../store";

export function Housekeeping() {
  const [hk, setHk] = useStored<Record<string, HkStatus>>("hk.status", {});
  // As in the design: counts rooms the attendant has moved to VC/VI this session.
  const done = Object.values(hk).filter((s) => s === "VI" || s === "VC").length;

  return (
    <div className="hk">
      <div className="hk-phone">
        <div className="hk-phone-head">
          <div>
            <div className="kicker-accent">Room Attendant</div>
            <div className="hk-attendant">Sari Handayani</div>
          </div>
          <div className="hk-zone">Zona lantai 7–11<br />{done} dari {HK_TASKS.length} selesai</div>
        </div>
        <div>
          {HK_TASKS.map((t) => {
            const st = hk[t.no] ?? t.start;
            return (
              <div key={t.no} className="hk-task hairline-row">
                <div className="hk-task-top">
                  <span className="hk-task-no">{t.no}</span>
                  <span className={t.prioClass}>{t.prio}</span>
                </div>
                <div className="hk-task-meta">
                  <span className={"hk-chip " + (st === "Cleaning" ? "st-cleaning" : ST[st][1])}>
                    {st === "Cleaning" ? "Sedang dibersihkan" : ST[st][0]}
                  </span>
                  <span>{t.type}</span>
                </div>
                <div className="hk-task-note">{t.note}</div>
                <button className={"hk-action" + (st === "VI" ? " is-reset" : "")}
                  onClick={() => setHk({ ...hk, [t.no]: HK_NEXT[st] })}>{HK_ACTION[st]}</button>
              </div>
            );
          })}
        </div>
        <div className="hk-offline">Mode offline aktif — 3 pembaruan menunggu sinkronisasi.</div>
      </div>

      <div className="hk-aside">
        <div>
          <h4 className="h4-sm">Cara kerja layar ini</h4>
          <p className="body-13">Tekan tombol pada tiap kartu untuk menjalankan alur status: Vacant Dirty → sedang dibersihkan → Vacant Clean → menunggu inspeksi supervisor. Setiap perubahan langsung mengubah Room Rack dan availability yang dijual ke channel.</p>
        </div>
        <div>
          <h4 className="h4-sm">Prioritas otomatis</h4>
          <p className="body-13">Urutan tugas disusun sistem berdasarkan due-out, VIP arrival, dan permintaan early check-in, lalu diseimbangkan per zona lantai agar beban tiap attendant setara.</p>
        </div>
        <div>
          <h4 className="h4-sm">Tombol besar, satu tangan</h4>
          <p className="body-13">Target sentuh minimum 46 px, dapat dioperasikan sambil mendorong trolley. Kamera untuk bukti kondisi kamar dan pencatatan minibar berada di dalam kartu kamar.</p>
        </div>
      </div>
    </div>
  );
}
