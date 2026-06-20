import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emitPaymentEvent } from "@/lib/event-bus"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()
    const { planId, amount, currency, method, description } = body

    if (!planId || !amount) {
      return NextResponse.json({ error: "planId and amount are required" }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        planId,
        amount,
        currency: currency || "USD",
        status: "pending",
        reviewStatus: "pending",
        priority: amount > 1000 ? "high" : amount > 500 ? "medium" : "normal",
        method: method || null,
        transactionId: `txn_${uuidv4().replace(/-/g, "").substring(0, 14)}`,
        description: description || null,
      },
      include: {
        user: { select: { id: true, username: true, email: true, googleEmail: true, image: true } },
      },
    })

    await logActivity(
      userId,
      "PAYMENT_CREATED",
      `Payment $${payment.amount} created for plan ${planId}`,
    )

    emitPaymentEvent({
      type: "payment_created",
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      username: payment.user.username,
      reviewStatus: payment.reviewStatus,
      priority: payment.priority,
      timestamp: Date.now(),
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("[PAYMENTS_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
