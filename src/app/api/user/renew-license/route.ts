import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import defaultLimiter from "@/lib/rate-limiter"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = (session.user as any).id

    const rateCheck = defaultLimiter.check(`renew-license:${userId}`)
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many attempts. Wait 60 seconds." }, { status: 429 })
    }

    const { licenseKey } = await req.json()
    if (!licenseKey || typeof licenseKey !== "string" || licenseKey.length < 5) {
      return NextResponse.json({ error: "Valid license key is required" }, { status: 400 })
    }

    const newLicense = await prisma.license.findUnique({
      where: { licenseKey: licenseKey.trim() },
      include: { plan: true },
    })

    if (!newLicense) {
      return NextResponse.json({ error: "License key not found" }, { status: 404 })
    }

    if (newLicense.status !== "active") {
      return NextResponse.json({ error: "This license is not active" }, { status: 400 })
    }

    if (newLicense.userId && newLicense.userId !== userId) {
      return NextResponse.json({ error: "This license key is already in use by another account" }, { status: 400 })
    }

    // Get user's current license
    const currentLicense = await prisma.license.findFirst({
      where: { userId, status: { in: ["active", "expired"] } },
      orderBy: { createdAt: "desc" },
    })

    const now = new Date()
    const expiryDate = new Date()
    const planDays = newLicense.plan?.durationDays || 30
    expiryDate.setDate(expiryDate.getDate() + planDays)

    if (currentLicense) {
      // Extend existing license's expiration
      await prisma.license.update({
        where: { id: currentLicense.id },
        data: {
          status: "active",
          expiresAt: currentLicense.expiresAt > now
            ? new Date(Math.max(currentLicense.expiresAt.getTime(), expiryDate.getTime()))
            : expiryDate,
          renewalCount: { increment: 1 },
          lastRenewedAt: new Date(),
        },
      })

      // Upgrade user's plan if needed
      if (newLicense.planId) {
        await prisma.user.update({
          where: { id: userId },
          data: { planId: newLicense.planId },
        })
      }

      // Mark the new license key as used
      await prisma.license.update({
        where: { id: newLicense.id },
        data: { userId, status: "used" },
      })

      await prisma.licenseHistory.create({
        data: {
          licenseId: currentLicense.id,
          action: "renewed",
          details: `Renewed with key ${licenseKey.substring(0, 6)}... Plan: ${newLicense.plan?.name || "Unknown"}. Extended to ${expiryDate.toISOString().split("T")[0]}`,
        },
      })

      await logActivity(userId, "LICENSE_RENEWED", `License renewed with key ${licenseKey.substring(0, 6)}... Extended to ${expiryDate.toISOString().split("T")[0]}`)
    } else {
      // No current license - activate the new one
      await prisma.license.update({
        where: { id: newLicense.id },
        data: {
          userId,
          activatedAt: new Date(),
          expiresAt: expiryDate,
        },
      })

      if (newLicense.planId) {
        await prisma.user.update({
          where: { id: userId },
          data: { planId: newLicense.planId },
        })
      }

      await prisma.licenseHistory.create({
        data: {
          licenseId: newLicense.id,
          action: "activated",
          details: `New license activated by user. Plan: ${newLicense.plan?.name || "Unknown"}. Expires: ${expiryDate.toISOString().split("T")[0]}`,
        },
      })

      await logActivity(userId, "LICENSE_ACTIVATED", `New license activated. Plan: ${newLicense.plan?.name}`)
    }

    return NextResponse.json({
      success: true,
      message: "License renewed successfully! Your Premium access has been extended.",
      expiresAt: expiryDate,
      planName: newLicense.plan?.name || "Premium",
      daysAdded: planDays,
    })
  } catch (error) {
    console.error("[RENEW_LICENSE]", error)
    return NextResponse.json({ error: "Renewal failed" }, { status: 500 })
  }
}
