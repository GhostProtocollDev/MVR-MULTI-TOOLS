'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(planId: string, field: string, value: any) {
    try {
      const res = await fetch("/api/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, [field]: value }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Plan updated")
    } catch {
      toast.error("Failed to update plan")
    }
  }

  function updateLocal(planId: string, field: string, value: any) {
    setPlans(plans.map((p) => p.id === planId ? { ...p, [field]: value } : p))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Modify pricing, discounts, and plan configurations</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-card text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
          </svg>
          <p className="text-sm text-muted-foreground">No plans found. Create a plan first.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card ${plan.isPopular ? "gradient-border" : ""}`}
            >
              {plan.isPopular && (
                <div className="absolute top-3 right-3">
                  <span className="badge-success">Popular</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: "hsl(var(--primary))" }}>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{plan.interval}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Lifetime Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number" step="0.01"
                      value={plan.price}
                      onChange={(e) => updateLocal(plan.id, "price", parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSave(plan.id, "price", plan.price)}
                      className="input-premium flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Yearly Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number" step="0.01"
                      value={plan.originalPrice || ""}
                      onChange={(e) => updateLocal(plan.id, "originalPrice", parseFloat(e.target.value) || null)}
                      onBlur={() => handleSave(plan.id, "originalPrice", plan.originalPrice)}
                      className="input-premium flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Monthly Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number" step="0.01"
                      value={plan.monthlyPrice || ""}
                      onChange={(e) => updateLocal(plan.id, "monthlyPrice", parseFloat(e.target.value) || null)}
                      onBlur={() => handleSave(plan.id, "monthlyPrice", plan.monthlyPrice)}
                      className="input-premium flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Weekly Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number" step="0.01"
                      value={plan.weeklyPrice || ""}
                      onChange={(e) => updateLocal(plan.id, "weeklyPrice", parseFloat(e.target.value) || null)}
                      onBlur={() => handleSave(plan.id, "weeklyPrice", plan.weeklyPrice)}
                      className="input-premium flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Trial Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number" step="0.01"
                      value={plan.trialPrice || ""}
                      onChange={(e) => updateLocal(plan.id, "trialPrice", parseFloat(e.target.value) || null)}
                      onBlur={() => handleSave(plan.id, "trialPrice", plan.trialPrice)}
                      className="input-premium flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{plan._count?.licenses || 0} licenses</span>
                <button
                  onClick={() => { updateLocal(plan.id, "isActive", !plan.isActive); handleSave(plan.id, "isActive", !plan.isActive) }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    plan.isActive
                      ? "bg-muted/50 text-muted-foreground hover:bg-muted"
                      : "text-foreground"
                  }`}
                  style={plan.isActive ? {} : { background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                >
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
