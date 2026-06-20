'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  viewport: { once: true },
}

const roleHome: Record<string, string> = {
  owner: "/owner",
  administrator: "/admin",
  moderator: "/moderator",
  reseller: "/reseller",
  user: "/dashboard",
}

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role
      router.replace(roleHome[role] || "/account")
    }
  }, [session, router])

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const headerBg = mounted
    ? scrolled
      ? "rgba(0,0,0,0.8)"
      : "rgba(0,0,0,0)"
    : "rgba(0,0,0,0)"

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb),0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Navigation */}
      <header
        style={{ background: headerBg }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl border-b border-white/5" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-bold text-xl">GHOST</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Status</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
              <Link href="/register" className="btn-primary text-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div
              className={`mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: "0ms" }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Enterprise License Management
              </span>
            </div>

            <h1
              className={`text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-balance mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: "100ms" }}
            >
              License Management{" "}
              <span className="text-gradient">Done Right</span>
            </h1>

            <p
              className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: "200ms" }}
            >
              Automate license expiration, manage renewals, track customers, and grow your software business with enterprise-grade tools.
            </p>

            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: "300ms" }}
            >
              <Link href="/register" className="btn-primary btn-lg text-base px-8 w-full sm:w-auto">
                Start Free Trial
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#demo" className="btn-outline btn-lg text-base px-8 w-full sm:w-auto">
                Watch Demo
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </a>
            </div>

            <div
              className={`mt-16 relative transition-all duration-800 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: "500ms" }}
            >
              <div className="glass-card rounded-2xl p-2 shadow-2xl">
                <div className="rounded-xl overflow-hidden bg-card">
                  <img
                    src="https://placehold.co/1200x675/1a1a2e/7c3aed?text=GHOST+Dashboard+Preview&font=inter"
                    alt="Dashboard Preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "50K+", label: "Licenses Managed" },
              { value: "10K+", label: "Active Customers" },
              { value: "4.9/5", label: "Customer Rating" },
            ].map((stat) => (
              <motion.div key={stat.label} {...staggerItem} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade tools to manage, protect, and grow your software business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🔐", title: "License Management", desc: "Automate license creation, activation, expiration, and renewal with full control." },
              { icon: "📊", title: "Owner Dashboard", desc: "Real-time revenue analytics, customer insights, and business intelligence at a glance." },
              { icon: "🎨", title: "Theme System", desc: "Unlimited custom themes, animated wallpapers, live editor, and complete customization." },
              { icon: "🎫", title: "Support System", desc: "Integrated ticket system, knowledge base, FAQ, and live chat architecture." },
              { icon: "🛡️", title: "Advanced Security", desc: "Login monitoring, device tracking, rate limiting, audit logs, and session management." },
              { icon: "📈", title: "Business Tools", desc: "Coupons, affiliate system, promotions, announcements, and detailed analytics." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="premium-card group cursor-default"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Simple Workflow</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes, not days.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 -translate-y-1/2" />
            {[
              { step: "01", title: "Create Plans", desc: "Set up your license tiers with custom pricing, duration, and features." },
              { step: "02", title: "Deploy Licenses", desc: "Generate and distribute license keys with automated activation." },
              { step: "03", title: "Monitor & Grow", desc: "Track everything from the dashboard and scale your business." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mx-auto mb-4 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter", price: "$29", period: "/month", desc: "Perfect for getting started",
                features: ["Up to 100 licenses", "Basic analytics", "Email support", "Standard themes"],
                popular: false,
              },
              {
                name: "Professional", price: "$79", period: "/month", desc: "Best for growing businesses",
                features: ["Up to 1000 licenses", "Advanced analytics", "Priority support", "Custom themes", "API access", "Affiliate system"],
                popular: true,
              },
              {
                name: "Enterprise", price: "$199", period: "/month", desc: "For large-scale operations",
                features: ["Unlimited licenses", "Real-time analytics", "24/7 support", "Everything included", "White-label", "SLA guarantee"],
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`premium-card relative ${plan.popular ? "border-primary/30 shadow-xl shadow-primary/5" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
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
                  className={`w-full ${plan.popular ? "btn-primary" : "btn-outline"} text-sm text-center`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Loved by Teams</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Chen", role: "CEO, TechFlow", content: "GHOST transformed how we manage licenses. The automation alone saved us 20 hours per week." },
              { name: "Marcus Johnson", role: "CTO, DevPro", content: "The best license management platform we've used. The theme system is incredible." },
              { name: "Emily Rodriguez", role: "Product Lead, SaaSify", content: "Customer support is outstanding. The dashboard gives us complete visibility into our business." },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: "How does license activation work?", a: "When a customer purchases a license, they receive a unique license key. They can activate it on their device, and our system validates and tracks the activation in real-time." },
              { q: "Can I customize the appearance?", a: "Absolutely! Our theme system allows unlimited customization with custom colors, wallpapers, layouts, and even a live theme editor." },
              { q: "What happens when a license expires?", a: "The system automatically detects expiration, revokes access immediately, and redirects users to the renewal page with a countdown. Grace periods are configurable." },
              { q: "Is there an affiliate system?", a: "Yes! Our built-in affiliate/referral system lets your customers earn rewards for referring new customers." },
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="premium-card cursor-pointer group"
              >
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="font-medium group-hover:text-primary transition-colors">{faq.q}</span>
                    <svg className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that trust GHOST for their license management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary btn-lg text-base px-10">
                Start Free Trial
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/contact" className="btn-outline btn-lg text-base px-8">
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-lg">GHOST</span>
              </div>
              <p className="text-sm text-muted-foreground">Enterprise license management platform for modern software businesses.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "API Docs", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 GHOST License System. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {["Twitter", "GitHub", "Discord", "YouTube"].map((s) => (
                <Link key={s} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
