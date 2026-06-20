'use client'

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.1),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Starter", price: "29", desc: "Perfect for getting started",
              features: ["Up to 100 licenses", "Basic analytics", "Email support", "Standard themes", "1 admin user", "License activation"],
              popular: false,
            },
            {
              name: "Professional", price: "79", desc: "Best for growing businesses",
              features: ["Up to 1,000 licenses", "Advanced analytics", "Priority support", "Custom themes", "5 admin users", "API access", "Affiliate system", "Coupon system"],
              popular: true,
            },
            {
              name: "Enterprise", price: "199", desc: "For large-scale operations",
              features: ["Unlimited licenses", "Real-time analytics", "24/7 support", "Everything included", "Unlimited admins", "White-label option", "SLA guarantee", "Custom integrations"],
              popular: false,
            },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`premium-card relative ${plan.popular ? "border-primary/30 shadow-xl shadow-primary/5 scale-105" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`w-full ${plan.popular ? "btn-primary" : "btn-outline"} text-sm text-center inline-flex items-center justify-center`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
              { q: "Is there a free trial?", a: "We offer a 14-day free trial on all plans. No credit card required." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for annual plans." },
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your licenses will remain active until the end of the billing period." },
            ].map((faq) => (
              <Card key={faq.q} className="group cursor-pointer">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none p-4 font-medium group-hover:text-primary transition-colors">
                    {faq.q}
                    <svg className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </details>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
