import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ApiRequest {
  method: string;
  query: URLSearchParams;
  body: unknown;
  cookies: Record<string, string>;
  /** Append a Set-Cookie header to the response. */
  setCookie: (cookie: string) => void;
}

type Method = "GET" | "POST";
type Handler = (req: ApiRequest) => Promise<unknown>;
type NodeRequest = IncomingMessage & { body?: unknown };

const MAX_BODY = 100_000;

/**
 * Wraps JSON handlers as a Node (req, res) function. Runs unchanged as a Vercel
 * serverless function and inside the Vite dev server (see app/vite.config.ts).
 */
export function route(handlers: Partial<Record<Method, Handler>>) {
  return async (req: NodeRequest, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    try {
      const handler = handlers[req.method as Method];
      if (!handler) {
        res.setHeader("Allow", Object.keys(handlers).join(", "));
        throw new HttpError(405, "Metode tidak didukung");
      }
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method !== "GET" && !String(req.headers["content-type"] ?? "").startsWith("application/json")) {
        // Plain HTML forms cannot send JSON cross-site, so this also blocks CSRF on cookie-authenticated POSTs.
        throw new HttpError(415, "Content-Type harus application/json");
      }
      const body = req.method === "GET" ? undefined : await readJson(req);
      const setCookies: string[] = [];
      const data = await handler({
        method: req.method!, query: url.searchParams, body,
        cookies: parseCookies(req.headers.cookie),
        setCookie: (c) => { setCookies.push(c); res.setHeader("Set-Cookie", setCookies); },
      });
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      res.statusCode = status;
      res.end(JSON.stringify({ error: status === 500 ? "Terjadi kesalahan di server" : (err as Error).message }));
    }
  };
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch { /* ignore malformed cookie */ }
  }
  return out;
}

async function readJson(req: NodeRequest): Promise<unknown> {
  try {
    // Vercel pre-parses JSON bodies onto req.body (a getter that throws on bad JSON).
    if ("body" in req && req.body !== undefined) {
      return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch {
    throw new HttpError(400, "Body bukan JSON yang valid");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, "Body terlalu besar");
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Body bukan JSON yang valid");
  }
}
