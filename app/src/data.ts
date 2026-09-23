// Mock data for the prototype — ported verbatim from the Claude Design handoff
// (project/POS Program.html). Swap these for API calls when a backend exists.

export type ScreenId =
  | "login" | "unit" | "frontdesk" | "avail" | "checkin"
  | "folio" | "rack" | "hk" | "pos" | "gm" | "finance";

export interface Screen { id: ScreenId; label: string; num: string }

export const SCREENS: Screen[] = [
  { id: "login", label: "Login", num: "00" },
  { id: "unit", label: "Cabang & Lokasi", num: "01" },
  { id: "frontdesk", label: "Front Desk (FD) Dashboard", num: "02" },
  { id: "avail", label: "FD - Availability Grid", num: "02A" },
  { id: "checkin", label: "FD - Check-in Wizard", num: "02B" },
  { id: "folio", label: "FD - Folio View", num: "02C" },
  { id: "rack", label: "FD - Room Rack", num: "02D" },
  { id: "hk", label: "FD - Housekeeping", num: "02E" },
  { id: "pos", label: "FD - POS Resto", num: "02F" },
  { id: "gm", label: "GM Dashboard", num: "03" },
  { id: "finance", label: "Finance", num: "04" },
];

export const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function noise(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ── 00 Login ───────────────────────────────────────────── */

export type Lang = "ID" | "EN";

export const T: Record<Lang, Record<string, string>> = {
  ID: {
    welcome: "Selamat Datang Kembali", signin: "Masuk Email Kantor Anda", email: "Email", pass: "Kata Sandi",
    showPass: "Lihat kata sandi", role: "Peran", btn: "Masuk", forgot: "Lupa kata sandi",
    need: "Butuh akun? Hubungi Admin", lastOut: "Logout terakhir dari perangkat ini",
  },
  EN: {
    welcome: "Welcome Back", signin: "Sign in with your office email", email: "Email", pass: "Password",
    showPass: "Show password", role: "Role", btn: "Sign in", forgot: "Forgot password",
    need: "Need an account? Contact Admin", lastOut: "Last logout from this device",
  },
};

export const LANGS: { code: Lang; label: string }[] = [
  { code: "ID", label: "Bahasa" },
  { code: "EN", label: "English" },
];

export const COMPANY_VALUES = [
  ["L", "Living with Integrity"],
  ["E", "Encourage Assertiveness & Professionalism"],
  ["S", "Strong Commitment"],
  ["T", "Teamwork with Loyalty"],
  ["A", "Achieve Services Level Agreements"],
  ["R", "Reliable Worth Ethic"],
  ["I", "Internal Harmony and Solidarity"],
] as const;

export const LOGIN_ROLES: { role: string; to: ScreenId }[] = [
  { role: "Front Office", to: "frontdesk" },
  { role: "Back Office", to: "gm" },
];

/* ── 01 Cabang & Lokasi ─────────────────────────────────── */

export interface Company { name: string; units: number; branches: [code: string, name: string, city: string][] }

export const COMPANIES: Company[] = [
  { name: "CIPTA HARMONI LESTARI", units: 12, branches: [["PST", "Pusat", "Jakarta"], ["GNJ", "Grand Nusantara Jakarta", "Jakarta Pusat"], ["NRB", "Nusantara Resort Bali", "Badung"], ["NCB", "Nusantara City Bandung", "Bandung"]] },
  { name: "CIPTA SELARAS CEMERLANG", units: 7, branches: [["PST", "Pusat", "Jakarta"], ["NES", "Nusantara Express Surabaya", "Surabaya"], ["NEM", "Nusantara Express Malang", "Malang"]] },
  { name: "HARMONI ADIL SELARAS", units: 3, branches: [["PST", "Pusat", "Jakarta"], ["HAS", "Harmoni Suites Yogyakarta", "Yogyakarta"]] },
  { name: "SERPONG BANGUN CIPTA", units: 3, branches: [["PST", "Pusat", "Jakarta"], ["SBC", "Unit Serpong", "Tangerang Selatan"]] },
  { name: "SERPONG BANGUN LESTARI", units: 5, branches: [["PST", "Pusat", "Jakarta"], ["SRP", "MARCHAND HYPE STATION", "Tangerang Selatan"], ["BDG", "Unit Bandung", "Bandung"], ["SBY", "Unit Surabaya", "Surabaya"], ["MDN", "Unit Medan", "Medan"]] },
  { name: "PERTIWI AGUNG LESTARI", units: 5, branches: [["PST", "Pusat", "Jakarta"], ["PAL", "Pertiwi Beach Club", "Gianyar"], ["PLB", "Unit Lombok", "Mataram"]] },
  { name: "BANGUN INDAH HARMONI", units: 1, branches: [["PST", "Pusat", "Jakarta"]] },
];

export const DEFAULT_COMPANY = "SERPONG BANGUN LESTARI";

/* ── 02 Front Desk Dashboard ────────────────────────────── */

export const FD_STATS = [
  { label: "Arrival hari ini", value: "42", sub: "18 sudah check-in · 6 VIP" },
  { label: "Departure", value: "37", sub: "29 selesai · 3 late check-out" },
  { label: "In-house", value: "186", sub: "412 tamu · 2 house use" },
  { label: "Siap dijual", value: "24", sub: "VC 11 · VI 13 · OOO 1" },
  { label: "Occupancy", value: "81,5%", sub: "ADR Rp 1.240.000 · RevPAR Rp 1.011.000", accent: true },
];

export const ARRIVALS = [
  { name: "Anindya Rahmawati", tag: "VIP", tagClass: "tag tag-accent-2", source: "Direct web", code: "HO7K3M", type: "Deluxe King", nights: 3, room: "Belum" },
  { name: "PT Astra Daihatsu (30)", tag: "Grup", tagClass: "tag tag-accent", source: "Corporate", code: "GRP-2291", type: "Superior Twin", nights: 2, room: "Blok L7" },
  { name: "Bayu Setiawan", tag: "Repeat", tagClass: "tag tag-neutral", source: "Traveloka", code: "TVL-88104", type: "Deluxe Twin", nights: 1, room: "0712" },
  { name: "Michael Tan", tag: "Prepaid", tagClass: "tag tag-neutral", source: "Booking.com", code: "BDC-46127", type: "Executive Suite", nights: 4, room: "1105" },
  { name: "Sri Wahyuni", tag: "Early CI", tagClass: "tag tag-outline", source: "Agoda", code: "AGD-71230", type: "Superior King", nights: 2, room: "Belum" },
  { name: "Hendra Kusuma", tag: "Corporate", tagClass: "tag tag-neutral", source: "Kontrak Pertamina", code: "COR-0451", type: "Deluxe King", nights: 5, room: "0908" },
];

export const ALERTS = [
  { kind: "Deposit", text: "Reservasi HO9F2P jatuh tempo hari ini pukul 18:00 — auto-release jika belum dibayar" },
  { kind: "Discrepancy", text: "Kamar 0914 sistem VD, laporan fisik OC — perlu verifikasi HK" },
  { kind: "Credit", text: "Folio 1105 mencapai 92% credit limit korporat" },
  { kind: "OTA", text: "Agoda retry ke-2 berhasil; 1 booking masuk terlambat 4 menit" },
];

/* ── 02A Availability Grid ──────────────────────────────── */

export const ROOM_TYPES = [
  { code: "SUP-K", name: "Superior King", count: 60, bar: 980000 },
  { code: "SUP-T", name: "Superior Twin", count: 64, bar: 980000 },
  { code: "DLX-K", name: "Deluxe King", count: 48, bar: 1180000 },
  { code: "DLX-T", name: "Deluxe Twin", count: 40, bar: 1180000 },
  { code: "EXE-S", name: "Executive Suite", count: 24, bar: 2350000 },
  { code: "FAM-S", name: "Family Suite", count: 12, bar: 2750000 },
];

const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MON = ["Sep", "Okt"];

export interface Day { i: number; label: string; mon: string; dow: string; weekend: boolean }

/** 30 days from Sat 12 Sep 2026. */
export const DAYS: Day[] = Array.from({ length: 30 }, (_, i) => {
  const dayNum = 12 + i;
  const m = dayNum > 30 ? 1 : 0;
  const dow = DOW[(5 + i) % 7];
  return { i, label: String(m ? dayNum - 30 : dayNum), mon: MON[m], dow, weekend: dow === "Jum" || dow === "Sab" };
});

export function availability(typeIndex: number, day: Day) {
  const occ = 0.62 + (day.weekend ? 0.2 : 0) + noise(typeIndex * 31 + day.i) * 0.26;
  return Math.max(0, Math.round(ROOM_TYPES[typeIndex].count * (1 - Math.min(occ, 1))));
}

export const CHANNELS = [
  "Booking.com · sinkron 8s lalu",
  "Agoda · sinkron 14s lalu",
  "Traveloka · sinkron 6s lalu",
  "Tiket.com · sinkron 11s lalu",
];

/* ── 02B Check-in Wizard ────────────────────────────────── */

export const CHECKIN_STEPS = ["Verifikasi identitas", "Pilih kamar", "Registration card", "Encode kunci", "Selesai"];

export const CHECKIN_ROOMS = [
  { no: "0912", view: "City view", status: "VI", note: "Sesuai preferensi high floor" },
  { no: "1014", view: "City view", status: "VI", note: "Connecting 1015" },
  { no: "0721", view: "Pool view", status: "VC", note: "Baru selesai dibersihkan" },
  { no: "1108", view: "City view", status: "VI", note: "Corner room, +Rp 150.000" },
];

/* ── 02C Folio View ─────────────────────────────────────── */

export type FolioId = "A" | "B" | "C";
type FolioRow = [date: string, code: string, desc: string, debit: number, credit: number, by: string];

export const FOLIO_LABELS: Record<FolioId, string> = { A: "Tamu", B: "Perusahaan", C: "Grup" };

export const FOLIOS: Record<FolioId, { owner: string; routing: string; rows: FolioRow[] }> = {
  A: {
    owner: "Anindya Rahmawati · Kamar 0912 · 12–15 Sep 2026",
    routing: "Room charge & pajak → Folio B (PT Sinar Mas Land). Incidental tetap di folio ini.",
    rows: [
      ["12 Sep", "MINIBAR", "Minibar — 2 air mineral, 1 kacang", 78000, 0, "HK-014"],
      ["12 Sep", "FB-RSV", "Room service — nasi goreng kampung, es teh", 165000, 0, "POS-RS"],
      ["13 Sep", "SPA", "Spa — Balinese massage 60 menit", 385000, 0, "POS-SPA"],
      ["13 Sep", "LAUNDRY", "Laundry express — 4 pcs", 132000, 0, "HK-LDY"],
      ["13 Sep", "FB-RST", "Nusantara Restaurant — makan malam 2 pax", 420000, 0, "POS-RST"],
      ["14 Sep", "PAY-QRIS", "Pembayaran QRIS", 0, 500000, "FO-RINA"],
    ],
  },
  B: {
    owner: "PT Sinar Mas Land · Kontrak COR-0388 · Credit limit Rp 250.000.000",
    routing: "Menerima room charge + pajak dari folio A. Ditagih via city ledger, termin 30 hari.",
    rows: [
      ["12 Sep", "ROOM", "Room charge Deluxe King 0912", 1180000, 0, "NIGHT-AUDIT"],
      ["12 Sep", "TAX", "PB1 10% + service 11%", 247800, 0, "NIGHT-AUDIT"],
      ["13 Sep", "ROOM", "Room charge Deluxe King 0912", 1180000, 0, "NIGHT-AUDIT"],
      ["13 Sep", "TAX", "PB1 10% + service 11%", 247800, 0, "NIGHT-AUDIT"],
      ["14 Sep", "ROOM", "Room charge Deluxe King 0912", 1180000, 0, "NIGHT-AUDIT"],
      ["14 Sep", "TAX", "PB1 10% + service 11%", 247800, 0, "NIGHT-AUDIT"],
    ],
  },
  C: {
    owner: "Master folio grup — PT Astra Daihatsu · 30 kamar · GRP-2291",
    routing: "Room + breakfast + coffee break ke master folio. Minibar & laundry ke folio tamu masing-masing.",
    rows: [
      ["12 Sep", "ROOM", "Room charge 30 × Superior Twin", 26400000, 0, "NIGHT-AUDIT"],
      ["12 Sep", "FB-BQT", "Coffee break 2× 60 pax", 5400000, 0, "BANQUET"],
      ["12 Sep", "FB-BQT", "Meeting package fullday 60 pax", 18000000, 0, "BANQUET"],
      ["12 Sep", "TAX", "PB1 10% + service 11%", 10458000, 0, "NIGHT-AUDIT"],
      ["12 Sep", "PAY-TRF", "Deposit transfer bank 50%", 0, 30129000, "FIN-DEWI"],
    ],
  },
};

/* ── 02D Room Rack / 02E Housekeeping ───────────────────── */

export type RoomStatus = "VI" | "VC" | "VD" | "OC" | "OD" | "OOO";
export type RackGroup = "ready" | "proses" | "terjual" | "tindakan";

/** label, CSS modifier class, rack filter group */
export const ST: Record<RoomStatus, [label: string, cls: string, group: RackGroup]> = {
  VI: ["Vacant Inspected", "st-vi", "ready"],
  VC: ["Vacant Clean", "st-vc", "ready"],
  VD: ["Vacant Dirty", "st-vd", "proses"],
  OC: ["Occupied Clean", "st-oc", "terjual"],
  OD: ["Occupied Dirty", "st-od", "terjual"],
  OOO: ["Out of Order", "st-ooo", "tindakan"],
};

export const RACK_FILTERS: [key: "all" | RackGroup, label: string][] = [
  ["all", "Semua"], ["ready", "Siap dijual"], ["proses", "Perlu dibersihkan"], ["terjual", "Terisi"], ["tindakan", "Perlu tindakan"],
];

const RACK_GUESTS = ["Anindya Rahmawati", "Bayu Setiawan", "Michael Tan", "Sri Wahyuni", "Hendra Kusuma", "Lie Mei Ling", "Fajar Nugroho", "Dian Puspita"];

export function rackGuest(no: string) {
  return RACK_GUESTS[Math.floor(noise(Number(no)) * RACK_GUESTS.length)];
}

export const RACK: { floor: string; rooms: { no: string; code: RoomStatus }[] }[] = (() => {
  const codes: RoomStatus[] = ["OC", "OC", "OC", "VI", "OD", "OC", "VD", "OC", "VC", "OC", "OC", "VI", "OOO", "OC"];
  const floors = [];
  for (let f = 7; f <= 11; f++) {
    const rooms = [];
    for (let i = 0; i < 14; i++) {
      rooms.push({ no: String(f) + String(i + 1).padStart(2, "0"), code: codes[Math.floor(noise(f * 17 + i) * codes.length)] });
    }
    floors.push({ floor: "Lantai " + f, rooms });
  }
  return floors;
})();

export type HkStatus = "VD" | "Cleaning" | "VC" | "VI";

export const HK_TASKS: { no: string; type: string; prio: string; prioClass: string; note: string; start: HkStatus }[] = [
  { no: "0912", type: "Deluxe King", prio: "VIP arrival", prioClass: "tag tag-accent-2", note: "Extra pillow, non-smoking", start: "VD" },
  { no: "0914", type: "Deluxe King", prio: "Discrepancy", prioClass: "tag tag-accent-2", note: "Sistem VD, laporan fisik OC — foto wajib", start: "VD" },
  { no: "0721", type: "Superior King", prio: "Early check-in", prioClass: "tag tag-outline", note: "Tamu tiba 11:30", start: "Cleaning" },
  { no: "0806", type: "Superior Twin", prio: "Due-out", prioClass: "tag tag-accent", note: "Check-out 12:00", start: "VD" },
  { no: "1014", type: "Deluxe Twin", prio: "Normal", prioClass: "tag tag-neutral", note: "Minibar restock", start: "VC" },
  { no: "1105", type: "Executive Suite", prio: "VIP arrival", prioClass: "tag tag-accent-2", note: "Fruit basket + welcome card", start: "VC" },
  { no: "0703", type: "Superior King", prio: "Normal", prioClass: "tag tag-neutral", note: "Linen ganti penuh", start: "VI" },
];

export const HK_NEXT: Record<HkStatus, HkStatus> = { VD: "Cleaning", Cleaning: "VC", VC: "VI", VI: "VD" };

export const HK_ACTION: Record<HkStatus, string> = {
  VD: "Mulai bersihkan", Cleaning: "Tandai selesai", VC: "Minta inspeksi", VI: "Sudah inspected — reset",
};

/* ── 02F POS Resto ──────────────────────────────────────── */

export { MENU, MENU_PRICE, posTotals } from "../../shared/pos";

export const DEFAULT_CART: Record<string, number> = { "Nasi Goreng Kampung": 2, "Es Teh Manis": 2, "Pisang Goreng Keju": 1 };

/* ── 03 GM Dashboard ────────────────────────────────────── */

export interface GmPeriod {
  kpis: [label: string, value: string, delta: string][];
  depts: [name: string, rev: number, share: string, vs: string][];
  props: [name: string, occ: string, adr: number, revpar: number, vs: string][];
  trend: number[];
  trendLabel: string;
}

export const GM: Record<string, GmPeriod> = {
  "Hari ini": {
    kpis: [["Occupancy", "81,5%", "+4,2 pt vs tahun lalu"], ["ADR", "Rp 1,24 jt", "+6,1%"], ["RevPAR", "Rp 1,01 jt", "+11,4%"], ["TRevPAR", "Rp 1,63 jt", "+9,8%"]],
    depts: [["Room", 231280000, "62%", "+11%"], ["F&B Restaurant", 68400000, "18%", "+7%"], ["Banquet & MICE", 52300000, "14%", "+21%"], ["Spa & Wellness", 14900000, "4%", "−3%"], ["Laundry & lain-lain", 7600000, "2%", "+2%"]],
    props: [["Grand Nusantara Jakarta", "81,5%", 1240000, 1011000, "+11,4%"], ["Nusantara Resort Bali", "92,0%", 2180000, 2006000, "+18,2%"], ["Nusantara City Bandung", "74,3%", 720000, 535000, "+3,1%"], ["Nusantara Express Surabaya", "68,8%", 465000, 320000, "−1,4%"]],
    trend: [62, 68, 71, 74, 69, 88, 91, 76, 72, 78, 82, 94, 96, 81],
    trendLabel: "Occupancy 14 hari terakhir (%) — puncak akhir pekan",
  },
  "Bulan ini": {
    kpis: [["Occupancy", "78,9%", "+3,1 pt vs tahun lalu"], ["ADR", "Rp 1,19 jt", "+5,4%"], ["RevPAR", "Rp 938 rb", "+9,2%"], ["GOPPAR", "Rp 402 rb", "+12,6%"]],
    depts: [["Room", 2680400000, "60%", "+9%"], ["F&B Restaurant", 812600000, "18%", "+6%"], ["Banquet & MICE", 714300000, "16%", "+24%"], ["Spa & Wellness", 178200000, "4%", "−2%"], ["Laundry & lain-lain", 89100000, "2%", "+4%"]],
    props: [["Grand Nusantara Jakarta", "78,9%", 1190000, 938000, "+9,2%"], ["Nusantara Resort Bali", "88,4%", 2050000, 1812000, "+15,7%"], ["Nusantara City Bandung", "71,2%", 695000, 494000, "+2,4%"], ["Nusantara Express Surabaya", "66,1%", 452000, 298000, "−2,8%"]],
    trend: [70, 73, 75, 79, 81, 84, 86, 83, 80, 77, 79, 82, 85, 79],
    trendLabel: "Occupancy per hari bulan ini (%) — rata-rata 78,9",
  },
  "Tahun ini": {
    kpis: [["Occupancy", "74,6%", "+5,8 pt vs tahun lalu"], ["ADR", "Rp 1,12 jt", "+7,9%"], ["RevPAR", "Rp 836 rb", "+16,3%"], ["Direct booking", "27,4%", "dari 12% baseline"]],
    depts: [["Room", 24180000000, "59%", "+16%"], ["F&B Restaurant", 7620000000, "19%", "+11%"], ["Banquet & MICE", 6480000000, "16%", "+29%"], ["Spa & Wellness", 1630000000, "4%", "+1%"], ["Laundry & lain-lain", 820000000, "2%", "+6%"]],
    props: [["Grand Nusantara Jakarta", "74,6%", 1120000, 836000, "+16,3%"], ["Nusantara Resort Bali", "82,1%", 1940000, 1593000, "+22,4%"], ["Nusantara City Bandung", "68,4%", 662000, 453000, "+6,7%"], ["Nusantara Express Surabaya", "63,9%", 438000, 280000, "+1,2%"]],
    trend: [58, 61, 66, 70, 72, 69, 74, 78, 81, 76, 79, 84, 88, 75],
    trendLabel: "Occupancy per bulan (%) — Jan sampai Sep berjalan",
  },
};
