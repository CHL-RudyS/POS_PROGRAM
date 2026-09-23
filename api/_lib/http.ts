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
      const body = req.method === "GET" ? undefined : await readJson(req);
      const data = await handler({ method: req.method!, query: url.searchParams, body });
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
