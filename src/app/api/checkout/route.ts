import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getStripe, PLANS_PRICE_LOOKUP } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await req.json()
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    const priceId = PLANS_PRICE_LOOKUP[planId]
    if (!priceId) {
      return NextResponse.json({ error: "No Stripe price configured for this plan" }, { status: 400 })
    }

    const userId = (session.user as any).id
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { planId, userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans?canceled=true`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[CHECKOUT_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
