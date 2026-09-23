import type { SessionUser } from "../../shared/auth";
import { SESSION_KEY } from "./api";
import { useStored } from "./store";

/** The signed-in user: undefined while the first /api/auth/me check runs, null when signed out. */
export function useSession() {
  return useStored<SessionUser | null | undefined>(SESSION_KEY, undefined)[0];
}
