export function AppHeader({ title }: { title: string }) {
  return (
    <header className="app-header">
      <div className="app-header-title">
        <div className="app-header-hotel">HotelOne · Grand Nusantara Hotel &amp; Suites, Jakarta Pusat · 248 kamar</div>
        <h2>{title}</h2>
      </div>
      <div className="app-header-meta">
        <span>Rina Pratiwi · Front Office · Shift 07:00–15:00</span>
        <span>Sabtu, 12 Sep 2026 · 09:14 WIB</span>
        <span className="tag tag-accent">Night audit 06:02 · balanced</span>
      </div>
    </header>
  );
}
