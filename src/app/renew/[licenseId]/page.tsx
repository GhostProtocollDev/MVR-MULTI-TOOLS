'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button, Card, CardContent, Input } from "@/components/ui"
import toast from "react-hot-toast"

export default function RenewPage({ params }: { params: { licenseId: string } }) {
  const [daysLeft, setDaysLeft] = useState(-5)
  const [selectedPlan, setSelectedPlan] = useState("monthly")
  const expired = daysLeft < 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.12),transparent_50%)]" />
      <div className={`absolute inset-0 ${expired ? "bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08),transparent_70%)]"}`} />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-4"
      >
        <Card className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
            expired ? "bg-destructive/10" : "bg-warning/10"
          }`}>
            {expired ? (
              <svg className="w-10 h-10 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Status */}
          <h1 className="text-2xl font-bold mb-2">
            {expired ? "License Expired" : "License Expiring Soon"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {expired
              ? "Your license has expired. Renew now to restore access."
              : "Your license will expire in 5 days. Renew now to avoid interruption."}
          </p>

          {/* Countdown */}
          {!expired && (
            <div className="flex justify-center gap-4 mb-6">
              {[
                { value: 5, label: "Days" },
                { value: 12, label: "Hours" },
                { value: 45, label: "Minutes" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold">
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-left">Select Renewal Plan</h3>
            {[
              { id: "monthly", label: "Monthly", price: "$79/mo", desc: "Billed monthly" },
              { id: "yearly", label: "Yearly", price: "$790/yr", desc: "Save 17%", popular: true },
              { id: "lifetime", label: "Lifetime", price: "$999", desc: "One-time payment" },
            ].map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div>
                  <div className="font-medium">{plan.label}</div>
                  <div className="text-xs text-muted-foreground">{plan.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{plan.price}</div>
                  {plan.popular && (
                    <span className="text-[10px] text-success font-medium">Best value</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Coupon */}
          <div className="flex items-center gap-2 mb-6">
            <Input placeholder="Enter coupon code" className="flex-1" />
            <Button variant="outline" size="sm">Apply</Button>
          </div>

          {/* Action */}
          <Button className="w-full btn-lg mb-3" onClick={() => toast.success("License renewed successfully!")}>
            {expired ? "Reactivate License" : "Renew Now"}
          </Button>

          <Link href="/account/licenses" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Back to Licenses
          </Link>
        </Card>
      </motion.div>
    </div>
  )
}
