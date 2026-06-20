import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { emitPaymentEvent } from "@/lib/event-bus"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature") || ""

    let event
    try {
      event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any
      const { planId, userId } = session.metadata || {}

      if (planId && userId) {
        const plan = await prisma.plan.findUnique({ where: { id: planId } })
        if (plan) {
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + (plan.durationDays || 30))

          const license = await prisma.license.create({
            data: {
              licenseKey: `LICS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              userId,
              planId,
              status: "active",
              expiresAt,
              maxActivations: 3,
            },
          })

          const payment = await prisma.payment.create({
            data: {
              userId,
              licenseId: license.id,
              planId,
              amount: session.amount_total ? session.amount_total / 100 : plan.price,
              currency: (session.currency || "usd").toUpperCase(),
              status: "completed",
              reviewStatus: "pending",
              priority: "normal",
              method: "stripe",
              transactionId: session.id || "",
              description: `Stripe payment for ${plan.name}`,
            },
            include: {
              user: { select: { id: true, username: true, email: true, googleEmail: true, image: true } },
            },
          })

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
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
