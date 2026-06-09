export type UserRole = "USER" | "ADMIN";

export interface Permission {
  action: "create" | "read" | "update" | "delete" | "manage";
  resource: "users" | "words" | "articles" | "ai_content" | "analytics" | "system";
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    { action: "read", resource: "words" },
    { action: "read", resource: "articles" },
    { action: "create", resource: "ai_content" },
    { action: "read", resource: "analytics" },
  ],
  ADMIN: [
    { action: "manage", resource: "users" },
    { action: "manage", resource: "words" },
    { action: "manage", resource: "articles" },
    { action: "manage", resource: "ai_content" },
    { action: "manage", resource: "analytics" },
    { action: "manage", resource: "system" },
  ],
};

export function getUserRole(userId?: string): UserRole {
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);
  if (userId && adminIds.includes(userId)) {
    return "ADMIN";
  }
  return "USER";
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some(
    (p) =>
      (p.action === "manage" || p.action === permission.action) &&
      p.resource === permission.resource,
  );
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`权限不足: 需要 ${permission.action}:${permission.resource} 权限`);
  }
}

export function isAdmin(userId?: string): boolean {
  return getUserRole(userId) === "ADMIN";
}
