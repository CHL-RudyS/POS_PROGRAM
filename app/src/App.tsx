import { useEffect, useState } from "react";
import { refreshSession } from "./api";
import { SCREENS, type ScreenId } from "./data";
import { AppHeader } from "./components/AppHeader";
import { Login } from "./screens/Login";
import { Cabang } from "./screens/Cabang";
import { FrontDesk } from "./screens/FrontDesk";
import { Availability } from "./screens/Availability";
import { CheckIn } from "./screens/CheckIn";
import { Folio } from "./screens/Folio";
import { RoomRack } from "./screens/RoomRack";
import { Housekeeping } from "./screens/Housekeeping";
import { PosResto } from "./screens/PosResto";
import { GmDashboard } from "./screens/GmDashboard";
import { Finance } from "./screens/Finance";
import { Users } from "./screens/Users";

export function App() {
  // The app always opens on 00 Login.
  const [screenId, setScreenId] = useState<ScreenId>("login");
  const screen = SCREENS.find((s) => s.id === screenId)!;

  useEffect(() => { refreshSession(); }, []);

  const go = (id: ScreenId) => {
    setScreenId(id);
    window.scrollTo(0, 0);
  };

  const content = (() => {
    switch (screenId) {
      case "login": return <Login onGo={go} />;
      case "unit": return <Cabang onGo={go} />;
      case "frontdesk": return <FrontDesk onGo={go} />;
      case "avail": return <Availability />;
      case "checkin": return <CheckIn onGo={go} />;
      case "folio": return <Folio />;
      case "rack": return <RoomRack />;
      case "hk": return <Housekeeping />;
      case "pos": return <PosResto onGo={go} />;
      case "finance": return <Finance onGo={go} />;
      case "users": return <Users onGo={go} />;
      case "gm": return <GmDashboard />;
    }
  })();

  return (
    <div className="shell">
      <main className="main">
        {/* 00 Login and 01 Cabang & Lokasi carry their own headings. */}
        {screenId !== "login" && screenId !== "unit" && <AppHeader title={screen.label} current={screenId} onGo={go} />}
        {content}
      </main>
    </div>
  );
}
