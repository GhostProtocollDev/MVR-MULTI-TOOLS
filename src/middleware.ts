import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const ROLES_HIERARCHY: Record<string, number> = {
  owner: 100,
  administrator: 80,
  moderator: 60,
  reseller: 40,
  user: 20,
}

export function hasAccess(role: string, minimum: string): boolean {
  return (ROLES_HIERARCHY[role] || 0) >= (ROLES_HIERARCHY[minimum] || 0)
}

const ROLE_HOME: Record<string, string> = {
  owner: "/dashboard",
  administrator: "/admin",
  moderator: "/moderator",
  reseller: "/reseller",
  user: "/dashboard",
}

type RouteGuard = { prefix: string; minimum: string; home: string }
const GUARDS: RouteGuard[] = [
  { prefix: "/owner", minimum: "owner", home: "/owner" },
  { prefix: "/admin", minimum: "administrator", home: "/admin" },
  { prefix: "/moderator", minimum: "moderator", home: "/moderator" },
  { prefix: "/reseller", minimum: "reseller", home: "/reseller" },
  { prefix: "/dashboard", minimum: "user", home: "/dashboard" },
]

function matchGuard(path: string): RouteGuard | undefined {
  return GUARDS.find((g) => path === g.prefix || path.startsWith(g.prefix + "/"))
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const path = req.nextUrl.pathname
  const role = (token as any)?.role || ""

  const isAuthPage = path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password"
  const isRoot = path === "/"
  const isApiAuth = path.startsWith("/api/auth")

  if (isApiAuth) return NextResponse.next()

  // Logged-in users on auth pages → redirect to role home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/dashboard", req.url))
  }

  // Logged-in users on root → redirect to role home
  if (token && isRoot) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] || "/dashboard", req.url))
  }

  // Owner API routes — check both next-auth and legacy owner_token
  if (path.startsWith("/api/owner")) {
    if (token && role === "owner") return NextResponse.next()
    const ownerToken = req.cookies.get("owner_token")
    if (!ownerToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.next()
  }

  // Owner route — redirect main pages to new /dashboard, fall back to legacy for others
  if (path.startsWith("/owner")) {
    if (path === "/owner/recovery") return NextResponse.next()
    if (path === "/owner" || path === "/owner/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (token && role === "owner") return NextResponse.next()
    const ownerToken = req.cookies.get("owner_token")
    if (!ownerToken) return NextResponse.redirect(new URL("/dashboard", req.url))
    return NextResponse.next()
  }

  // Remote access routes — authenticated users
  if (path.startsWith("/dashboard/remote")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Protected routes — check authentication
  const guard = matchGuard(path)
  if (guard) {
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(loginUrl)
    }
    if (!hasAccess(role, guard.minimum)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] || "/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Account routes
  if (path.startsWith("/account")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/owner/:path*",
    "/admin/:path*",
    "/moderator/:path*",
    "/reseller/:path*",
    "/api/owner/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/",
  ],
}
