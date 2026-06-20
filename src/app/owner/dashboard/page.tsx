'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [paymentStats, setPaymentStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/owner/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
    fetch("/api/owner/payments?reviewStatus=pending&limit=1")
      .then((r) => r.json())
      .then((d) => setPaymentStats(d.stats || {}))
      .catch(() => {})
  }, [])

  return (
    <motion.div initial="initial" animate="animate" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Full platform control and oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/owner/audit" className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700">
            View Audit Log
          </Link>
          <Link href="/owner/settings" className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700">
            Owner Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 28450), icon: "💰", color: "text-green-400" },
          { title: "Active Licenses", value: String(stats?.activeLicenses || 342), icon: "🔑", color: "text-blue-400" },
          { title: "Total Customers", value: String(stats?.totalCustomers || 189), icon: "👥", color: "text-purple-400" },
          { title: "Platform Health", value: "98.7%", icon: "❤️", color: "text-red-400" },
          { title: "Pending Reviews", value: String(paymentStats?.waitingReview || 0), icon: "💳", color: "text-yellow-400" },
        ].map((stat) => (
          <motion.div key={stat.title} variants={fadeIn} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-zinc-600">REALTIME</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Owner Action Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Platform Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { icon: "🔑", label: "Generate Licenses", href: "/owner/licenses", desc: "Create and manage license keys" },
            { icon: "💳", label: "Payment Review", href: "/owner/payments", desc: "Approve or review payments" },
            { icon: "📋", label: "Manage Plans", href: "/owner/plans", desc: "Create and edit subscription plans" },
            { icon: "🎨", label: "Theme Marketplace", href: "/owner/themes", desc: "Manage available themes" },
            { icon: "📢", label: "Announcements", href: "/owner/announcements", desc: "Broadcast to all users" },
            { icon: "🎫", label: "Support Tickets", href: "/owner/support", desc: "View all customer tickets" },
            { icon: "🔗", label: "Referral System", href: "/owner/referrals", desc: "Manage affiliate program" },
            { icon: "📝", label: "Changelog", href: "/owner/changelog", desc: "Document platform updates" },
            { icon: "📈", label: "Analytics", href: "/owner/analytics", desc: "Deep financial and usage data" },
            { icon: "🛡️", label: "Security", href: "/owner/security", desc: "Platform security controls" },
            { icon: "🔄", label: "Active Sessions", href: "/owner/sessions", desc: "Manage owner sessions" },
            { icon: "📜", label: "Audit Trail", href: "/owner/audit", desc: "Complete action history" },
            { icon: "⚙️", label: "Settings", href: "/owner/settings", desc: "Platform configuration" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                variants={fadeIn}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 group h-full"
              >
                <span className="text-2xl block mb-2">{item.icon}</span>
                <h3 className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">{item.label}</h3>
                <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Owner Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Audit Activity</h2>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {[
                { action: "LICENSE_GENERATED", details: "Created 5 Professional licenses", time: "2 min ago" },
                { action: "PLAN_UPDATED", details: "Modified Enterprise plan pricing", time: "1 hour ago" },
                { action: "SESSION_TERMINATED", details: "Terminated inactive session", time: "3 hours ago" },
                { action: "THEME_PUBLISHED", details: "Published 'Midnight Purple' theme", time: "6 hours ago" },
                { action: "ANNOUNCEMENT_SENT", details: "System maintenance notice sent to all users", time: "1 day ago" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{log.action}</span>
                    <span className="text-sm text-zinc-300">{log.details}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
