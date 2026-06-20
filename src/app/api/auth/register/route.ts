import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import defaultLimiter from "@/lib/rate-limiter"

export async function POST(req: Request) {
  try {
    const ip = (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || (req as any).headers?.get?.("x-real-ip") || "unknown"
    const result = defaultLimiter.check(`register:${ip}`)
    if (!result.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { username, password, name } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const freePlan = await prisma.plan.findFirst({ where: { name: "Free" } })

    await prisma.user.create({
      data: {
        username,
        name: name || username,
        email: `${username}@ghost.local`,
        password: hashedPassword,
        role: "customer",
        planId: freePlan?.id || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
