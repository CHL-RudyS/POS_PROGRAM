import type { NewTransaction, PaymentMethod, Transaction, TransactionSummary } from "../../shared/pos";
import type { SessionUser } from "../../shared/auth";
import { setStored } from "./store";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init, credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi internet.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith("/api/auth/login")) setStored<SessionUser | null>(SESSION_KEY, null);
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Server error ${res.status}`);
  return data as T;
}

/* ── Session ───────────────────────────────────────────── */

/** Store key for the signed-in user: undefined = not checked yet, null = signed out. */
export const SESSION_KEY = "session.user";

export async function login(email: string, password: string) {
  const user = await request<SessionUser>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  setStored(SESSION_KEY, user);
  return user;
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
  setStored(SESSION_KEY, null);
}

export async function refreshSession() {
  try {
    setStored(SESSION_KEY, await request<SessionUser>("/api/auth/me"));
  } catch {
    setStored(SESSION_KEY, null);
  }
}

/* ── POS transactions ──────────────────────────────────── */

export function saveTransaction(tx: NewTransaction) {
  return request<Transaction>("/api/pos/transactions", { method: "POST", body: JSON.stringify(tx) });
}

export interface TransactionList { date: string; transactions: Transaction[]; summary: TransactionSummary }

export function listTransactions(filter: { date: string; method?: PaymentMethod | ""; status?: string }) {
  const q = new URLSearchParams({ date: filter.date });
  if (filter.method) q.set("method", filter.method);
  if (filter.status) q.set("status", filter.status);
  return request<TransactionList>("/api/pos/transactions?" + q);
}

export function voidTransaction(id: number, reason: string) {
  return request<Transaction>("/api/pos/void", { method: "POST", body: JSON.stringify({ id, reason }) });
}
