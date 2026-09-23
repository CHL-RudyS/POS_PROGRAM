# HotelOne — CHL Group (POS Program)

React + TypeScript + Vite implementation of the Claude Design handoff in
`../project/POS Program.html` (design chat: `../chats/chat1.md`).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

The app always opens on **00 Login**. Switch screens with the floating
**Menu Layar** pill at bottom-left (see `../project/CLAUDE.md`).

| No. | Screen | File |
| --- | --- | --- |
| 00 | Login | `src/screens/Login.tsx` |
| 01 | Cabang & Lokasi | `src/screens/Cabang.tsx` |
| 02 | Front Desk (FD) Dashboard | `src/screens/FrontDesk.tsx` |
| 02A | FD - Availability Grid | `src/screens/Availability.tsx` |
| 02B | FD - Check-in Wizard | `src/screens/CheckIn.tsx` |
| 02C | FD - Folio View | `src/screens/Folio.tsx` |
| 02D | FD - Room Rack | `src/screens/RoomRack.tsx` |
| 02E | FD - Housekeeping | `src/screens/Housekeeping.tsx` |
| 02F | FD - POS Resto | `src/screens/PosResto.tsx` |
| 03 | GM Dashboard | `src/screens/GmDashboard.tsx` |

- `src/data.ts` holds all mock data (ported verbatim from the design) — the
  place to swap in API calls.
- `src/styles/broadsheet.css` is the Broadsheet design system (tokens +
  component classes); `src/styles/app.css` holds the layout and screen styles.
- `src/store.ts` keeps each screen's UI state for the session, so a POS cart or
  housekeeping progress survives switching screens, as in the prototype.
