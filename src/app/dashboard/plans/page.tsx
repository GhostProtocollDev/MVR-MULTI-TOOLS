'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, Button, Badge } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"

export default function PlansBuyPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleBuy(planId: string) {
    setBuying(planId)
    try {
      const plan = plans.find((p) => p.id === planId)
      if (!plan) throw new Error("Plan not found")
      const userId = (session?.user as any)?.id
      if (!userId) throw new Error("Not authenticated")

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (plan.durationDays || 30))

      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          userId,
          expiresAt: expiresAt.toISOString(),
          maxActivations: plan.maxActivations || 3,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to purchase license")
      }
      toast.success("License purchased successfully!")
    } catch (e: any) {
      toast.error(e.message || "Failed to purchase license")
    } finally {
      setBuying(null)
    }
  }

  async function handleStripeBuy(planId: string) {
    setBuying(planId)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create checkout")
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start checkout")
    } finally {
      setBuying(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planes</h1>
        <p className="text-muted-foreground mt-1">Elige el plan que mejor se adapte a tus necesidades</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-60 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.filter(p => p.isActive !== false).map((plan) => (
            <Card key={plan.id} className={`relative p-6 flex flex-col ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="success">MÁS POPULAR</Badge>
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                  <p className="text-sm text-primary/70">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  {plan.originalPrice > plan.price && (
                    <span className="text-lg text-primary/40 line-through">{formatCurrency(plan.originalPrice)}</span>
                  )}
                  <span className="text-4xl font-extrabold text-primary">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-primary/60">/{plan.interval}</span>
                </div>
                {plan.features && (
                  <ul className="space-y-2 text-sm">
                    {plan.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleBuy(plan.id)}
                  loading={buying === plan.id}
                  disabled={buying !== null}
                >
                  Comprar {plan.name}
                </Button>
                {plan.price > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStripeBuy(plan.id)}
                    loading={buying === plan.id}
                    disabled={buying !== null}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 7.667 0 4.47 2.591 4.47 6.511c0 3.29 2.303 4.861 5.19 5.934 2.556.95 3.328 1.481 3.328 2.456 0 .708-.573 1.248-1.905 1.248-2.522 0-5.008-1.079-6.845-1.904l-.898 5.494c1.495.816 4.018 1.532 6.745 1.532 4.492 0 7.855-2.313 7.855-6.415 0-3.448-2.717-4.869-5.854-5.857z"/></svg>
                    Pay with Stripe
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
