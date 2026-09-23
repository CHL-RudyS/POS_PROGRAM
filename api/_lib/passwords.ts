import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { HttpError } from "./http";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem });
  return timingSafeEqual(actual, expected);
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    throw new HttpError(400, "Password minimal 8 karakter");
  }
  return password;
}
