'use client'

import { motion } from "framer-motion"
import Link from "next/link"
import { Card } from "@/components/ui"

const faqCategories = [
  {
    name: "Getting Started",
    questions: [
      { q: "How do I create an account?", a: "Click the 'Get Started' button on our homepage or visit the registration page. Fill in your details and verify your email address to start." },
      { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans." },
      { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial on all plans with no credit card required. You can explore all features during this period." },
    ],
  },
  {
    name: "Licenses",
    questions: [
      { q: "How does license activation work?", a: "After purchase, you receive a unique license key. Enter this in your application to activate. The system validates and tracks the activation in real-time." },
      { q: "What happens when my license expires?", a: "You'll receive email reminders at 30, 14, 7, 3, and 1 day before expiration. After expiration, you have a grace period to renew before access is revoked." },
      { q: "Can I transfer my license to another device?", a: "Yes, you can deactivate a license from one device and activate it on another through your account dashboard." },
    ],
  },
  {
    name: "Billing",
    questions: [
      { q: "How do I upgrade my plan?", a: "You can upgrade at any time from your account settings. The price difference will be prorated for the remainder of your billing period." },
      { q: "Can I get a refund?", a: "Yes, we offer a 30-day money-back guarantee on all plans. Contact our support team to process your refund." },
      { q: "How do I cancel my subscription?", a: "You can cancel from your billing settings. Your licenses will remain active until the end of your paid billing period." },
    ],
  },
  {
    name: "Technical",
    questions: [
      { q: "Is there an API available?", a: "Yes, Professional and Enterprise plans include access to our REST API for license management, validation, and automation." },
      { q: "How do I integrate GHOST with my application?", a: "We provide SDKs for popular languages and frameworks. Check our documentation for detailed integration guides." },
      { q: "What security measures are in place?", a: "We use encryption, rate limiting, suspicious login detection, audit logging, and two-factor authentication to protect your data." },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.08),transparent_50%)]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Can't find what you're looking for? <Link href="/contact" className="text-primary hover:underline">Contact support</Link></p>
        </motion.div>

        <div className="space-y-12">
          {faqCategories.map((category) => (
            <div key={category.name}>
              <h2 className="text-xl font-bold mb-6">{category.name}</h2>
              <div className="space-y-3">
                {category.questions.map((faq) => (
                  <Card key={faq.q} className="group cursor-pointer">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none p-4 font-medium group-hover:text-primary transition-colors">
                        {faq.q}
                        <svg className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </summary>
                      <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </details>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
