import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== "owner" && userRole !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { licenseKey, assignedRole, duration, maxActivations, status, notes, assignedUser, customDate } = body

    if (!licenseKey) {
      return NextResponse.json({ error: "License key is required" }, { status: 400 })
    }

    const durationDays: Record<string, number | null> = {
      lifetime: null,
      "24months": 730,
      "12months": 365,
      "6months": 182,
      "3months": 91,
      "1month": 30,
      "2weeks": 14,
      "1week": 7,
      trial: 3,
    }

    const days = durationDays[duration] ?? 30
    const isLifetime = duration === "lifetime"
    const expiresAt = isLifetime
      ? new Date(Date.now() + 365 * 365 * 86400000)
      : new Date(Date.now() + days * 86400000)

    let userId: string | null = null
    if (assignedUser) {
      const user = await prisma.user.findUnique({ where: { username: assignedUser } })
      if (user) userId = user.id
    }
    if (!userId) {
      const owner = await prisma.user.findFirst({ where: { role: "owner" } })
      if (owner) userId = owner.id
    }

    const license = await prisma.license.create({
      data: {
        licenseKey,
        userId: userId || (session.user as any).id,
        assignedRole: assignedRole || "user",
        status: status || "active",
        maxActivations: maxActivations || 3,
        isLifetime,
        expiresAt: customDate ? new Date(customDate) : expiresAt,
        notes: notes || null,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "LICENSE_CREATED",
        details: `License ${licenseKey} created with role ${assignedRole}`,
      },
    })

    return NextResponse.json({ license })
  } catch (error) {
    console.error("[CREATE_LICENSE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
