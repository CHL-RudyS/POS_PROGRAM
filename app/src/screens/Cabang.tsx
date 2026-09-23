import { COMPANIES, DEFAULT_COMPANY, type ScreenId } from "../data";
import { useStored } from "../store";
import { SearchIcon } from "../components/icons";
import { useSession } from "../session";
import { ROLE_LABELS } from "../../../shared/auth";

export function Cabang({ onGo }: { onGo: (id: ScreenId) => void }) {
  const user = useSession();
  const [co, setCo] = useStored("unit.company", DEFAULT_COMPANY);
  const [query, setQuery] = useStored("unit.query", "");
  const q = query.toLowerCase();
  const company = COMPANIES.find((c) => c.name === co) ?? COMPANIES[4];
  const branches = company.branches.filter(
    ([code, name, city]) => !q || name.toLowerCase().includes(q) || city.toLowerCase().includes(q) || code.toLowerCase().includes(q),
  );

  return (
    <div className="unit">
      <div className="unit-welcome">
        <div className="unit-greet">
          <div className="unit-greet-label">Selamat Datang Kembali :</div>
          <h2>{user?.name ?? "Rina Pratiwi"}</h2>
          <div className="unit-greet-role">{user ? ROLE_LABELS[user.role] : "Administrator"}</div>
          <div className="unit-greet-rule" />
          <p>Pilih hotel dan lokasi cabang untuk mulai atau melanjutkan pekerjaan yang belum selesai.</p>
          <div className="unit-greet-login">Login 12 September 2026 · 08:41 WIB</div>
        </div>

        <div className="company-panel">
          <div className="company-panel-title">Daftar Perusahaan</div>
          <div className="company-list">
            {COMPANIES.map((c) => (
              <button key={c.name} className={"company" + (co === c.name ? " is-active" : "")}
                onClick={() => { setCo(c.name); setQuery(""); }}>
                <span className="company-dot" />
                <span className="company-name">{c.name}</span>
                <span className="company-units">{c.units} unit</span>
              </button>
            ))}
          </div>
          <div className="company-count">{COMPANIES.length} perusahaan</div>
        </div>
      </div>

      <div className="branch-panel">
        <div>
          <h4>{company.name}</h4>
          <div className="branch-panel-sub">Pilih cabang yang ingin anda buka.</div>
        </div>
        <div className="branch-search">
          <SearchIcon color="var(--color-neutral-700)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari unit bisnis..." aria-label="Cari unit bisnis" />
        </div>
        <div className="branch-grid">
          {branches.map(([code, name, city]) => (
            <button key={code} className="branch" onClick={() => onGo("frontdesk")}>
              <span className="branch-code">{code}</span>
              <span className="branch-name">{name}</span>
              <span className="branch-city">{city}</span>
            </button>
          ))}
        </div>
        <div className="branch-status">
          <span className="is-todo"><span className="branch-status-dot" />0 Modul Perlu Dikerjakan</span>
          <span className="is-diff"><span className="branch-status-dot" />0 Modul Masih Selisih</span>
        </div>
        <div className="branch-version">Versi Beta</div>
      </div>
    </div>
  );
}
