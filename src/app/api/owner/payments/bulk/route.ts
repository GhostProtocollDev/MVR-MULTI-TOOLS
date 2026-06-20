import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emitPaymentEvent } from "@/lib/event-bus"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { paymentIds, action } = body

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json({ error: "paymentIds array is required" }, { status: 400 })
    }

    const validActions = ["approve", "reject", "refund", "delete"]
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const actorId = (session?.user as any)?.id
    const actorName = (session?.user as any)?.username
    let count = 0

    if (action === "delete") {
      await prisma.$transaction(
        paymentIds.map((id) =>
          prisma.payment.delete({ where: { id } })
        )
      )
      count = paymentIds.length
    } else {
      const statusMap: Record<string, string> = {
        approve: "approved",
        reject: "rejected",
        refund: "refunded",
      }

      const updated = await prisma.$transaction(
        paymentIds.map((id) =>
          prisma.payment.update({
            where: { id },
            data: {
              reviewStatus: statusMap[action],
              reviewedBy: actorId,
              reviewedAt: new Date(),
            },
            include: {
              user: { select: { id: true, username: true } },
            },
          })
        )
      )
      count = paymentIds.length

      for (const payment of updated) {
        emitPaymentEvent({
          type: "payment_updated",
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          username: payment.user.username,
          reviewStatus: payment.reviewStatus,
          priority: payment.priority,
          timestamp: Date.now(),
        })
      }
    }

    await logActivity(
      actorId,
      `BULK_PAYMENT_${action.toUpperCase()}`,
      `Bulk ${action} on ${count} payment(s) by ${actorName}`,
    )

    return NextResponse.json({ count })
  } catch (error) {
    console.error("[OWNER_PAYMENTS_BULK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
