import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()

    // Find all active expired licenses
    const expiredLicenses = await prisma.license.findMany({
      where: {
        status: "active",
        expiresAt: { lte: now },
      },
      include: { user: true },
    })

    // Check grace period
    for (const license of expiredLicenses) {
      if (license.gracePeriodEnd) {
        if (now > license.gracePeriodEnd) {
          await prisma.license.update({
            where: { id: license.id },
            data: { status: "expired" },
          })
          await prisma.notification.create({
            data: {
              userId: license.userId,
              type: "expired",
              title: "License Expired",
              message: `Your license ${license.licenseKey} has expired and the grace period has ended.`,
              licenseId: license.id,
            },
          })
        }
      } else {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: "expired" },
        })
      }
    }

    // Check for licenses expiring soon (send notifications)
    const thirtyDays = new Date(now.getTime() + 30 * 86400000)
    const fourteenDays = new Date(now.getTime() + 14 * 86400000)
    const sevenDays = new Date(now.getTime() + 7 * 86400000)
    const threeDays = new Date(now.getTime() + 3 * 86400000)
    const oneDay = new Date(now.getTime() + 1 * 86400000)

    const upcomingExpirations = await prisma.license.findMany({
      where: {
        status: "active",
        expiresAt: {
          gte: now,
          lte: thirtyDays,
        },
      },
      include: { user: true },
    })

    for (const license of upcomingExpirations) {
      const diff = license.expiresAt.getTime() - now.getTime()
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))

      const notificationDays = [30, 14, 7, 3, 1]
      if (notificationDays.includes(daysLeft)) {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: license.userId,
            licenseId: license.id,
            type: "expiring_soon",
            message: { contains: `${daysLeft} days` },
          },
        })
        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              userId: license.userId,
              type: "expiring_soon",
              title: "License Expiring Soon",
              message: `Your license ${license.licenseKey} will expire in ${daysLeft} days. Renew now to avoid interruption.`,
              licenseId: license.id,
            },
          })
        }
      }
    }

    return NextResponse.json({
      expired: expiredLicenses.length,
      warningsSent: upcomingExpirations.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check licenses" }, { status: 500 })
  }
}
