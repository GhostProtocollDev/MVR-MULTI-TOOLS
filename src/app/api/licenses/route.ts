import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { generateLicenseKey } from "@/lib/utils"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const licenses = await prisma.license.findMany({
      where,
      include: { user: true, plan: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ licenses })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { userId, planId, expiresAt, maxActivations, autoRenew, isLifetime } = body

    if (!userId || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const license = await prisma.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        userId,
        planId,
        expiresAt: new Date(expiresAt),
        maxActivations: maxActivations || 3,
        autoRenew: autoRenew || false,
        isLifetime: isLifetime || false,
      },
    })

    await logActivity((session.user as any).id, "License created", `License ${license.licenseKey} created`)

    return NextResponse.json({ license })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create license" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, status, autoRenew, maxActivations } = body

    const license = await prisma.license.update({
      where: { id },
      data: { ...(status && { status }), ...(autoRenew !== undefined && { autoRenew }), ...(maxActivations && { maxActivations }) },
    })

    await logActivity((session.user as any).id, "License updated", `License ${license.licenseKey} updated`)

    return NextResponse.json({ license })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing license ID" }, { status: 400 })

    await prisma.license.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 })
  }
}
