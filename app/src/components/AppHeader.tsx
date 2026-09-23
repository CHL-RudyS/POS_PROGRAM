import { ROLE_LABELS, can } from "../../../shared/auth";
import { logout } from "../api";
import { SCREENS, type ScreenId } from "../data";
import { useSession } from "../session";

// Screens that need a role are listed only for users who hold it.
const NAV_PERMISSION: Partial<Record<ScreenId, Parameters<typeof can>[1]>> = {
  finance: "viewFinance",
  users: "manageUsers",
};

// Short labels for the header menu; the full name stays in the page title.
const NAV_LABEL: Partial<Record<ScreenId, string>> = {
  unit: "Cabang",
  frontdesk: "Front Desk",
  avail: "Availability",
  checkin: "Check-in",
  folio: "Folio",
  rack: "Room Rack",
  hk: "Housekeeping",
  pos: "POS Resto",
  gm: "GM",
};

export function AppHeader({ title, current, onGo }: { title: string; current: ScreenId; onGo: (id: ScreenId) => void }) {
  const user = useSession();
  const items = SCREENS.filter((s) => s.id !== "login" && (!NAV_PERMISSION[s.id] || can(user?.role, NAV_PERMISSION[s.id]!)));
  return (
    <header className="app-header-wrap">
      <div className="app-header">
        <div className="app-header-title">
          <div className="app-header-hotel">HotelOne · Grand Nusantara Hotel &amp; Suites, Jakarta Pusat · 248 kamar</div>
          <h2>{title}</h2>
        </div>
        <div className="app-header-meta">
          {user ? (
            <>
              <span>{user.name} · {ROLE_LABELS[user.role]} · Shift 07:00–15:00</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => { await logout(); onGo("login"); }}>Keluar</button>
            </>
          ) : user === null ? (
            <button className="btn btn-ghost btn-sm" onClick={() => onGo("login")}>Belum login — Masuk</button>
          ) : null}
          <span>Sabtu, 12 Sep 2026 · 09:14 WIB</span>
          <span className="tag tag-accent">Night audit 06:02 · balanced</span>
        </div>
      </div>
      <nav className="app-nav" aria-label="Navigasi layar">
        {items.map((s) => (
          <a key={s.id} href={"#" + s.id} aria-current={s.id === current ? "page" : undefined}
            onClick={(e) => { e.preventDefault(); onGo(s.id); }}>{NAV_LABEL[s.id] ?? s.label}</a>
        ))}
      </nav>
    </header>
  );
}
