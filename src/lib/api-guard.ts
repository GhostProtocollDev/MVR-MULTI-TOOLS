import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { NextResponse } from "next/server"

export type Role = "owner" | "administrator" | "moderator" | "reseller" | "user"

export const ROLES_HIERARCHY: Record<Role, number> = {
  owner: 100,
  administrator: 80,
  moderator: 60,
  reseller: 40,
  user: 20,
}

export function hasAccess(role: string, minimum: Role): boolean {
  return (ROLES_HIERARCHY[role as Role] || 0) >= (ROLES_HIERARCHY[minimum] || 0)
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireRole(minimum: Role) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  }
  const role = (session.user as any).role
  if (!hasAccess(role, minimum)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

export function getRole(session: any): string {
  return (session?.user as any)?.role || "user"
}

export function getId(session: any): string {
  return (session?.user as any)?.id || ""
}
