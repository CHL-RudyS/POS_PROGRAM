import { CHECKIN_ROOMS, CHECKIN_STEPS, type ScreenId } from "../data";
import { setStored, useStored } from "../store";

/** Reset the wizard to step 1 for a guest — called before navigating here. */
export function startCheckIn(guest: string) {
  setStored("checkin.step", 1);
  setStored("checkin.guest", guest);
}

export function CheckIn({ onGo }: { onGo: (id: ScreenId) => void }) {
  const [step, setStep] = useStored("checkin.step", 1);
  const [guest] = useStored("checkin.guest", "Anindya Rahmawati");
  const [room, setRoom] = useStored("checkin.room", "0912");
  const back = () => setStep(Math.max(1, step - 1));

  return (
    <div className="checkin">
      <div className="checkin-steps">
        {CHECKIN_STEPS.map((label, i) => {
          const n = i + 1;
          const state = n === step ? " is-active" : n < step ? " is-done" : " is-todo";
          return (
            <button key={label} className={"utab" + state} onClick={() => setStep(n)} aria-current={n === step ? "step" : undefined}>
              <span className="utab-num">{String(n).padStart(2, "0")}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="checkin-guest">
        <h3>{guest}</h3>
        <span className="tag tag-accent-2">VIP tier Gold</span>
        <span className="muted-12">HO7K3M · Deluxe King · 12–15 Sep 2026 · 2 dewasa</span>
      </div>

      {step === 1 && (
        <div className="grid-260">
          <div>
            <h4 className="h4-md">Pindai identitas</h4>
            <div className="id-scan">KTP terbaca via OCR<br />NIK terverifikasi · 0,8 detik</div>
            <div className="note" style={{ marginTop: "var(--space-2)" }}>Data identitas disimpan terenkripsi sesuai UU PDP No. 27/2022. Consent pemasaran: ya.</div>
          </div>
          <div className="stack-3">
            <div className="field"><label>Nama lengkap</label><input className="input" value="Anindya Rahmawati" readOnly /></div>
            <div className="field"><label>NIK</label><input className="input" value="3174 0xxx xxxx 0004" readOnly /></div>
            <div className="field"><label>Telepon</label><input className="input" defaultValue="+62 812 3456 7890" /></div>
            <div className="field"><label>Catatan preferensi</label><input className="input" defaultValue="High floor, non-smoking, extra pillow" /></div>
            <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>Lanjut — pilih kamar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="section-head">
            <h4 className="h4-flush">Kamar tersedia — Deluxe King</h4>
            <span className="muted-12">Auto-assign menyarankan 0912</span>
          </div>
          {CHECKIN_ROOMS.map((r) => (
            <button key={r.no} className={"checkin-room" + (room === r.no ? " is-picked" : "")}
              onClick={() => { setRoom(r.no); setStep(3); }}>
              <span className="checkin-room-no">{r.no}</span>
              <span className="checkin-room-status">{r.status}</span>
              <span className="checkin-room-view">{r.view}</span>
              <span className="checkin-room-note">{r.note}</span>
            </button>
          ))}
          <div className="checkin-nav">
            <button className="btn btn-secondary" onClick={back}>Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Kamar {room} — lanjut</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid-260">
          <div>
            <h4 className="h4-md">Registration card digital</h4>
            <div className="reg-card">
              <div>Kamar {room} · Deluxe King</div>
              <div>Rate BAR Rp 1.180.000 / malam</div>
              <div>3 malam · total Rp 3.540.000</div>
              <div>Pajak &amp; service 21% termasuk</div>
              <div>Jaminan: kartu ter-tokenisasi · deposit incidental Rp 500.000</div>
            </div>
          </div>
          <div>
            <div className="signature">Tanda tangan elektronik — tablet tamu</div>
            <div className="checkin-nav">
              <button className="btn btn-secondary" onClick={back}>Kembali</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Setujui &amp; encode kunci</button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ maxWidth: 460 }}>
          <h4 className="h4-sm">Encode kunci</h4>
          <p className="body-13" style={{ margin: "0 0 var(--space-3)" }}>Kartu 1 dan 2 dikirim ke encoder meja 2. Masa berlaku sampai 15 Sep 2026 12:00, akses lift lantai 9 dan lounge eksekutif.</p>
          <div className="checkin-nav is-tight">
            <button className="btn btn-secondary" onClick={back}>Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(5)}>Selesaikan check-in</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="checkin-done" style={{ maxWidth: 520 }}>
          <div className="kicker-accent">Check-in selesai — 1 menit 24 detik</div>
          <h3>Kamar {room} aktif, folio A terbuka</h3>
          <p className="body-13" style={{ margin: "0 0 var(--space-3)" }}>Status kamar berubah VI → OC, kunci aktif, WiFi kredensial terkirim ke +62 812 3456 7890, dan housekeeping menerima catatan extra pillow.</p>
          <div className="checkin-nav is-tight">
            <button className="btn btn-primary" onClick={() => onGo("folio")}>Buka folio</button>
            <button className="btn btn-secondary" onClick={() => onGo("frontdesk")}>Kembali ke dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
