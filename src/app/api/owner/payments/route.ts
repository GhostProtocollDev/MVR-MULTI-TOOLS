import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emitPaymentEvent } from "@/lib/event-bus"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const reviewStatus = searchParams.get("reviewStatus") || "all"
    const method = searchParams.get("method")
    const planId = searchParams.get("planId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    if (reviewStatus !== "all") {
      where.reviewStatus = reviewStatus
    }
    if (method) {
      where.method = method
    }
    if (planId) {
      where.planId = planId
    }
    if (priority) {
      where.priority = priority
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.user = {
        OR: [
          { username: { contains: search } },
          { email: { contains: search } },
          { googleEmail: { contains: search } },
        ],
      }
    }

    const [payments, total, pending, approved, rejected] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true, googleEmail: true, image: true } },
          license: { select: { id: true, licenseKey: true, planId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { reviewStatus: "pending" } }),
      prisma.payment.count({ where: { reviewStatus: "approved" } }),
      prisma.payment.count({ where: { reviewStatus: "rejected" } }),
    ])

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [waitingReview, highPriority, recentlyApproved, recentlyRejected] = await Promise.all([
      prisma.payment.count({ where: { reviewStatus: "pending" } }),
      prisma.payment.count({ where: { priority: "high", reviewStatus: "pending" } }),
      prisma.payment.count({ where: { reviewStatus: "approved", reviewedAt: { gte: sevenDaysAgo } } }),
      prisma.payment.count({ where: { reviewStatus: "rejected", reviewedAt: { gte: sevenDaysAgo } } }),
    ])

    return NextResponse.json({
      payments,
      total,
      pending,
      approved,
      rejected,
      stats: { waitingReview, highPriority, recentlyApproved, recentlyRejected },
    })
  } catch (error) {
    console.error("[OWNER_PAYMENTS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { paymentId, reviewStatus, priority } = body

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, username: true, email: true, googleEmail: true, image: true } },
        license: { select: { id: true, licenseKey: true, planId: true } },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const data: any = {}
    const actorId = (session?.user as any)?.id

    if (reviewStatus) {
      const validStatuses = ["pending", "approved", "rejected", "refunded"]
      if (!validStatuses.includes(reviewStatus)) {
        return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 })
      }
      data.reviewStatus = reviewStatus
      data.reviewedBy = actorId
      data.reviewedAt = new Date()

      await logActivity(
        actorId,
        `PAYMENT_${reviewStatus.toUpperCase()}`,
        `Payment ${paymentId} ($${payment.amount}) ${reviewStatus} by ${(session?.user as any)?.username}`,
      )
    }

    if (priority) {
      const validPriorities = ["normal", "medium", "high"]
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
      }
      data.priority = priority
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data,
      include: {
        user: { select: { id: true, username: true, email: true, googleEmail: true, image: true } },
        license: { select: { id: true, licenseKey: true, planId: true } },
      },
    })

    if (reviewStatus) {
      emitPaymentEvent({
        type: "payment_updated",
        paymentId: updated.id,
        amount: updated.amount,
        currency: updated.currency,
        username: updated.user.username,
        reviewStatus: updated.reviewStatus,
        priority: updated.priority,
        timestamp: Date.now(),
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[OWNER_PAYMENTS_PATCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
