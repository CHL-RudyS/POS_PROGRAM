import type { NewTransaction, PaymentMethod, Transaction, TransactionSummary } from "../../shared/pos";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
  return data as T;
}

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
