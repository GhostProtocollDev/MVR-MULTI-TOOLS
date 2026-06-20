import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { licenses: true } } },
    })
    return NextResponse.json({ plans })
  } catch {
    return NextResponse.json({ plans: [] })
  }
}

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
    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price || 0,
        originalPrice: body.originalPrice || null,
        interval: body.interval || "monthly",
        durationDays: body.durationDays || 30,
        features: body.features || "[]",
        isPopular: body.isPopular || false,
      },
    })
    return NextResponse.json({ plan })
  } catch (error) {
    console.error("[PLANS_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
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
    const { planId, ...fields } = body

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: fields,
    })

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "PRICING_UPDATED",
        details: `Plan ${plan.name} updated`,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("[PLANS_PATCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
