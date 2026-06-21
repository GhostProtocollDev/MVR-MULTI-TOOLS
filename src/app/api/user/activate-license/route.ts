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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    const rateCheck = defaultLimiter.check(`activate-license:${userId}`)
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many attempts. Wait 60 seconds." }, { status: 429 })
    }

    const { licenseKey } = await req.json()
    if (!licenseKey || typeof licenseKey !== "string" || licenseKey.length < 5) {
      return NextResponse.json({ error: "Valid license key is required" }, { status: 400 })
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: licenseKey.trim() },
      include: { plan: true },
    })

    if (!license) {
      await logActivity(userId, "LICENSE_ACTIVATE_FAIL", `Invalid key attempt: ${licenseKey.substring(0, 6)}...`, ip)
      return NextResponse.json({ error: "License key not found" }, { status: 404 })
    }

    if (license.status === "suspended") {
      return NextResponse.json({ error: "This license has been suspended" }, { status: 400 })
    }
    if (license.status === "revoked") {
      return NextResponse.json({ error: "This license has been revoked" }, { status: 400 })
    }
    if (license.status === "expired") {
      return NextResponse.json({ error: "This license has expired" }, { status: 400 })
    }

    if (license.expiresAt < new Date() && !license.isLifetime) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "expired" },
      })
      return NextResponse.json({ error: "This license has expired" }, { status: 400 })
    }

    // Prevent reusing a license already assigned to someone else
    if (license.userId && license.userId !== userId) {
      return NextResponse.json({ error: "This license key is already in use" }, { status: 400 })
    }

    // Assign license to user if not already
    const updateData: any = {
      userId,
      status: "active",
    }

    if (!license.activatedAt) {
      updateData.activatedAt = new Date()
    }

    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: updateData,
      include: { plan: true },
    })

    // Upgrade user to the license's plan
    if (updatedLicense.planId) {
      await prisma.user.update({
        where: { id: userId },
        data: { planId: updatedLicense.planId },
      })
    }

    // Log the activation
    await prisma.licenseHistory.create({
      data: {
        licenseId: license.id,
        action: "activate",
        details: `Activated by user ${(session.user as any).username || userId}. IP: ${ip}`,
        ip,
      },
    })

    await logActivity(
      userId,
      "LICENSE_ACTIVATED",
      `User activated license ${licenseKey.substring(0, 8)}... Plan: ${updatedLicense.plan?.name || "Unknown"}`,
      ip,
    )

    return NextResponse.json({
      success: true,
      message: "License activated successfully! Your account has been upgraded.",
      license: {
        id: updatedLicense.id,
        licenseKey: updatedLicense.licenseKey.substring(0, 4) + "-****-****-****",
        status: updatedLicense.status,
        planName: updatedLicense.plan?.name || "Premium",
        expiresAt: updatedLicense.expiresAt,
        isLifetime: updatedLicense.isLifetime,
      },
    })
  } catch (error) {
    console.error("[ACTIVATE_LICENSE]", error)
    return NextResponse.json({ error: "Activation failed" }, { status: 500 })
  }
}
