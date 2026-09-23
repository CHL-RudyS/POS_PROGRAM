// POS pricing and transaction types shared by the browser app (app/) and the
// serverless API (api/). The API recomputes every total from this price list,
// so a tampered request cannot change what gets stored.

export const MENU: Record<string, [name: string, price: number][]> = {
  "Makanan": [["Nasi Goreng Kampung", 95000], ["Sate Ayam Madura", 110000], ["Gado-Gado Jakarta", 78000], ["Soto Betawi", 98000], ["Ikan Gurame Bakar", 185000], ["Club Sandwich", 92000], ["Mie Goreng Seafood", 105000], ["Rendang Daging", 145000]],
  "Minuman": [["Es Teh Manis", 32000], ["Kopi Tubruk", 38000], ["Jus Alpukat", 55000], ["Es Kelapa Muda", 48000], ["Teh Tarik", 42000], ["Air Mineral 600ml", 25000]],
  "Bar": [["Bintang Draft", 78000], ["Mojito", 145000], ["Wine by Glass", 165000], ["Mocktail Nusantara", 95000]],
  "Dessert": [["Es Campur", 58000], ["Pisang Goreng Keju", 52000], ["Klappertaart", 65000], ["Sorbet Markisa", 48000]],
};

export const MENU_PRICE: Record<string, number> = Object.fromEntries(Object.values(MENU).flat());

/** Service 11% on subtotal, PB1 10% on (subtotal + service). */
export function posTotals(sub: number) {
  return {
    sub,
    svc: Math.round(sub * 0.11),
    tax: Math.round(sub * 1.11 * 0.1),
    total: Math.round(sub * 1.11 * 1.1),
  };
}

export const PAYMENT_METHODS = ["ROOM", "CASH", "QRIS", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  ROOM: "Charge to room", CASH: "Tunai", QRIS: "QRIS", CARD: "Kartu",
};

/** Body of POST /api/pos/transactions. Prices and totals are never sent — the server computes them. */
export interface NewTransaction {
  clientRef: string;
  items: { name: string; qty: number }[];
  method: PaymentMethod;
  roomNo?: string;
  guestName?: string;
  outlet?: string;
  tableNo?: string;
  pax?: number;
  waiter?: string;
}

export interface TransactionItem { name: string; qty: number; price: number; amount: number }

export interface Transaction {
  id: number;
  no: string;
  createdAt: string;
  outlet: string;
  tableNo: string;
  pax: number;
  waiter: string;
  method: PaymentMethod;
  roomNo: string | null;
  guestName: string | null;
  subtotal: number;
  service: number;
  tax: number;
  total: number;
  status: "posted" | "void";
  voidReason: string | null;
  voidedAt: string | null;
  /** Names of the users who saved / voided the bill (null for rows saved before login existed). */
  createdBy: string | null;
  voidedBy: string | null;
  items: TransactionItem[];
}

export interface TransactionSummary {
  count: number;
  total: number;
  voidCount: number;
  byMethod: Record<PaymentMethod, { count: number; total: number }>;
}
