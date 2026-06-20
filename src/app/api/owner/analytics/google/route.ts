import { NextResponse } from "next/server"
import { requireRole } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { error, session } = await requireRole("owner")
    if (error) return error

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [totalUsers, googleUsers, activeToday, recentLogins, suspiciousAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { googleEmail: { not: null } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: twentyFourHoursAgo } } }),
      prisma.loginHistory.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, email: true, googleEmail: true } } },
      }),
      prisma.loginHistory.count({
        where: { status: "failed", createdAt: { gte: twentyFourHoursAgo } },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      googleUsers,
      activeToday,
      recentLogins,
      suspiciousAttempts,
    })
  } catch (error) {
    console.error("[GOOGLE_ANALYTICS]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
