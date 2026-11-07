export const ROLES = ["SUPER_ADMIN", "ADMIN", "USER"] as const

export type Role = (typeof ROLES)[number]

export const USER_ROLES: Role[] = ["USER"]
export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"]
