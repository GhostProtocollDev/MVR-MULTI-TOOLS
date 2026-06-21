import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    const freePlan = await prisma.plan.findFirst({ where: { name: "Free" } })

    // Find all active expired licenses
    const expiredLicenses = await prisma.license.findMany({
      where: {
        status: "active",
        expiresAt: { lte: now },
        isLifetime: false,
      },
      include: { user: { select: { id: true, username: true } } },
    })

    let downgraded = 0
    let expired = 0

    for (const license of expiredLicenses) {
      if (license.gracePeriodEnd && now <= license.gracePeriodEnd) continue

      await prisma.license.update({
        where: { id: license.id },
        data: { status: "expired" },
      })
      expired++

      // Auto-downgrade user to Free plan
      if (freePlan && license.userId) {
        const user = await prisma.user.findUnique({
          where: { id: license.userId },
          select: { planId: true },
        })
        if (user && user.planId === license.planId) {
          await prisma.user.update({
            where: { id: license.userId },
            data: { planId: freePlan.id },
          })
          downgraded++
        }
      }

      await prisma.notification.create({
        data: {
          userId: license.userId,
          type: "expired",
          title: "License Expired",
          message: `Your Premium license has expired. Renew your license to regain Premium access. You have been moved to the Free plan.`,
          licenseId: license.id,
        },
      })

      await prisma.notification.create({
        data: {
          userId: license.userId,
          type: "plan_downgraded",
          title: "Downgraded to Free Plan",
          message: `Your Premium access has ended. You are now on the Free plan. Activate a new license to restore Premium features.`,
        },
      })
    }

    // Check for licenses expiring soon (send warnings)
    const warningDays = [7, 3, 1]
    for (const days of warningDays) {
      const target = new Date(now.getTime() + days * 86400000)
      const targetEnd = new Date(target.getTime() + 86400000)

      const upcomingExpirations = await prisma.license.findMany({
        where: {
          status: "active",
          isLifetime: false,
          expiresAt: { gte: target, lt: targetEnd },
        },
        include: { user: { select: { id: true, username: true } } },
      })

      for (const license of upcomingExpirations) {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: license.userId,
            licenseId: license.id,
            type: "expiring_soon",
            message: { contains: `${days} day` },
            createdAt: { gte: new Date(now.getTime() - 86400000) },
          },
        })
        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              userId: license.userId,
              type: "expiring_soon",
              title: `License Expires in ${days} Day${days > 1 ? "s" : ""}`,
              message: `Your Premium license expires in ${days} day${days > 1 ? "s" : ""}. Renew now to avoid interruption and keep your Premium features.`,
              licenseId: license.id,
            },
          })
        }
      }
    }

    return NextResponse.json({
      expired,
      downgraded,
      message: `${expired} licenses expired, ${downgraded} users downgraded to Free`,
    })
  } catch (error) {
    console.error("[CHECK_EXPIRY]", error)
    return NextResponse.json({ error: "Failed to check licenses" }, { status: 500 })
  }
}
