// User roles shared by the app and the API.

export const ROLES = ["cashier", "finance", "supervisor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  cashier: "Kasir", finance: "Finance", supervisor: "Supervisor", admin: "Administrator",
};

/** Who may do what — the API enforces these; the app only uses them to hide buttons. */
export const PERMISSIONS = {
  saveTransaction: ["cashier", "supervisor", "admin"],
  viewFinance: ["finance", "supervisor", "admin"],
  voidTransaction: ["supervisor", "admin"],
  manageUsers: ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export const can = (role: Role | undefined, action: keyof typeof PERMISSIONS) =>
  !!role && (PERMISSIONS[action] as readonly Role[]).includes(role);

export interface SessionUser { id: number; email: string; name: string; role: Role }

/** A user as listed on the 05 User screen. */
export interface AdminUser extends SessionUser {
  active: boolean;
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
