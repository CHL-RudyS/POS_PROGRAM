import { ROLE_LABELS } from "../../../shared/auth";
import { logout } from "../api";
import type { ScreenId } from "../data";
import { useSession } from "../session";

export function AppHeader({ title, onGo }: { title: string; onGo: (id: ScreenId) => void }) {
  const user = useSession();
  return (
    <header className="app-header">
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
    </header>
  );
}
