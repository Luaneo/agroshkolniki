type Role = keyof typeof ROLES;
type Permission = (typeof ROLES)[Role][number];

const ROLES = {
  admin: [
    "create:users",
    "read:users",
    "update:users",
    "delete:users",
    "upload:images",
  ],
  shiftLead: ["upload:images"],
} as const;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLES[role] as readonly Permission[]).includes(permission);
}
