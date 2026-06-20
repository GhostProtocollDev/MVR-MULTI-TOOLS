import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const licenses = await prisma.license.findMany({
      include: {
        user: { select: { id: true, username: true, name: true, email: true, role: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const now = new Date()
    const stats = {
      total: licenses.length,
      active: licenses.filter((l) => l.status === "active" && l.expiresAt > now).length,
      expired: licenses.filter((l) => l.status === "expired" || l.expiresAt <= now).length,
      expiringSoon: licenses.filter((l) => {
        if (l.isLifetime || l.status !== "active") return false
        const days = Math.ceil((l.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 0 && days <= 7
      }).length,
      lifetime: licenses.filter((l) => l.isLifetime).length,
      admins: licenses.filter((l) => l.user.role === "admin").length,
      resellers: licenses.filter((l) => l.user.role === "reseller").length,
      users: licenses.filter((l) => l.user.role === "customer" || l.user.role === "user").length,
    }

    return NextResponse.json({ licenses, stats })
  } catch (error) {
    console.error("[OWNER_LICENSES_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, licenseId } = body

    if (!action || !licenseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId }, include: { user: true } })
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 })
    }

    const beforeSnapshot = JSON.stringify(license)

    switch (action) {
      case "extend": {
        const { days } = body
        if (!days || typeof days !== "number" || days < 1) {
          return NextResponse.json({ error: "Invalid days" }, { status: 400 })
        }
        const newExpiry = new Date(license.expiresAt.getTime() + days * 86400000)
        await prisma.license.update({
          where: { id: licenseId },
          data: {
            expiresAt: newExpiry,
            renewalCount: { increment: 1 },
            lastRenewedAt: new Date(),
          },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "extend",
            details: JSON.stringify({ before: beforeSnapshot, after: { expiresAt: newExpiry.toISOString(), days } }),
          },
        })
        return NextResponse.json({ success: true, message: `Extended by ${days} days` })
      }

      case "convert-lifetime": {
        await prisma.license.update({
          where: { id: licenseId },
          data: { isLifetime: true, expiresAt: new Date("2099-12-31") },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "convert_lifetime",
            details: JSON.stringify({ before: beforeSnapshot, after: { isLifetime: true } }),
          },
        })
        return NextResponse.json({ success: true, message: "Converted to lifetime" })
      }

      case "reduce": {
        const { days } = body
        if (!days || typeof days !== "number" || days < 1) {
          return NextResponse.json({ error: "Invalid days" }, { status: 400 })
        }
        const newExpiry = new Date(license.expiresAt.getTime() - days * 86400000)
        if (newExpiry < new Date()) {
          await prisma.license.update({
            where: { id: licenseId },
            data: { status: "expired", expiresAt: new Date() },
          })
          await prisma.licenseHistory.create({
            data: {
              licenseId,
              action: "reduce_expired",
              details: JSON.stringify({ before: beforeSnapshot, after: { expiresAt: new Date().toISOString() } }),
            },
          })
          return NextResponse.json({ success: true, message: "Time reduced - license now expired" })
        }
        await prisma.license.update({
          where: { id: licenseId },
          data: { expiresAt: newExpiry },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "reduce",
            details: JSON.stringify({ before: beforeSnapshot, after: { expiresAt: newExpiry.toISOString(), days } }),
          },
        })
        return NextResponse.json({ success: true, message: `Reduced by ${days} days` })
      }

      case "transfer": {
        const { targetUserId } = body
        if (!targetUserId) {
          return NextResponse.json({ error: "Missing target user" }, { status: 400 })
        }
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
        if (!targetUser) {
          return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }
        await prisma.license.update({
          where: { id: licenseId },
          data: { userId: targetUserId },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "transfer",
            details: JSON.stringify({ before: beforeSnapshot, after: { userId: targetUserId } }),
          },
        })
        return NextResponse.json({ success: true, message: `Transferred to ${targetUser.username}` })
      }

      case "change-role": {
        const { role } = body
        if (!role || !["customer", "admin", "reseller"].includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }
        await prisma.user.update({
          where: { id: license.userId },
          data: { role },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "change_role",
            details: JSON.stringify({ before: beforeSnapshot, after: { role } }),
          },
        })
        return NextResponse.json({ success: true, message: `Role changed to ${role}` })
      }

      case "suspend": {
        await prisma.license.update({
          where: { id: licenseId },
          data: { status: "suspended" },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "suspend",
            details: JSON.stringify({ before: beforeSnapshot, after: { status: "suspended" } }),
          },
        })
        return NextResponse.json({ success: true, message: "License suspended" })
      }

      case "reactivate": {
        await prisma.license.update({
          where: { id: licenseId },
          data: { status: "active" },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "reactivate",
            details: JSON.stringify({ before: beforeSnapshot, after: { status: "active" } }),
          },
        })
        return NextResponse.json({ success: true, message: "License reactivated" })
      }

      case "revoke": {
        await prisma.license.update({
          where: { id: licenseId },
          data: { status: "expired", expiresAt: new Date() },
        })
        await prisma.licenseHistory.create({
          data: {
            licenseId,
            action: "revoke",
            details: JSON.stringify({ before: beforeSnapshot, after: { status: "expired" } }),
          },
        })
        return NextResponse.json({ success: true, message: "License revoked" })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[OWNER_LICENSES_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
