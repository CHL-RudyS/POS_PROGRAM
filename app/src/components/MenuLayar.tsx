import { useEffect, useState } from "react";
import { SCREENS, type Screen, type ScreenId } from "../data";
import { SearchDuotone } from "./icons";

/** Floating screen switcher, bottom-left. Named "Menu Layar" per project/CLAUDE.md — never a sidebar. */
export function MenuLayar({ current, onGo }: { current: Screen; onGo: (id: ScreenId) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => { setOpen(!open); setQuery(""); };
  const q = query.toLowerCase();
  const items = SCREENS.filter((s) => !q || s.label.toLowerCase().includes(q) || s.num.toLowerCase().includes(q));

  return (
    <div className="menu-layar">
      {open && (
        <div className="menu-layar-panel" role="dialog" aria-label="Menu Layar">
          <div className="menu-layar-title">Menu Layar</div>
          <input className="menu-layar-search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari layar" autoFocus />
          <div className="menu-layar-list">
            {items.map((s) => (
              <button key={s.id} className={"menu-layar-item" + (s.id === current.id ? " is-active" : "")}
                onClick={() => { onGo(s.id); setOpen(false); setQuery(""); }}>
                <span className="menu-layar-item-num">{s.num}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="menu-layar-pill">
        <button className="menu-layar-current" onClick={toggle} aria-expanded={open}>
          <span className="menu-layar-current-num">{current.num}</span>
          <span>{current.label}</span>
        </button>
        <button className="menu-layar-find" onClick={toggle} aria-label="Cari layar">
          <SearchDuotone />
        </button>
      </div>
    </div>
  );
}
