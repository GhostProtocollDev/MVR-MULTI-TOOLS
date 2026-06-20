import { NextRequest, NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import defaultLimiter from "@/lib/rate-limiter"

const handler = NextAuth(authOptions)

async function authHandler(req: NextRequest, context: any) {
  if (req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
    const result = defaultLimiter.check(`login:${ip}`)
    if (!result.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }
  }
  return handler(req, context)
}

export { authHandler as GET, authHandler as POST }
