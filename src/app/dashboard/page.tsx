'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { getRoleColor, getRoleLabel } from "@/types"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

function StatCard({ title, value, change, icon, color, index }: {
  title: string; value: string; change?: string; icon: string; color: string; index: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-card group cursor-default"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `hsl(var(--${color}) / 0.12)` }}
        >
          {icon}
        </div>
        {change && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            change.startsWith("+") ? "text-success" : "text-destructive"
          }`} style={{
            background: change.startsWith("+")
              ? "hsl(var(--success) / 0.12)"
              : "hsl(var(--destructive) / 0.12)"
          }}>
            {change}
          </span>
        )}
      </div>
      <div className="text-[28px] font-bold tracking-tight mb-0.5">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const user = (session?.user as any) || {}
  const userRole: string = user.role || "user"
  const isOwner = userRole === "owner"

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const topCountries = [
    { name: "United States", code: "US", count: 342, flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", count: 189, flag: "🇬🇧" },
    { name: "Germany", code: "DE", count: 156, flag: "🇩🇪" },
    { name: "Canada", code: "CA", count: 134, flag: "🇨🇦" },
    { name: "Australia", code: "AU", count: 98, flag: "🇦🇺" },
    { name: "France", code: "FR", count: 87, flag: "🇫🇷" },
    { name: "Brazil", code: "BR", count: 76, flag: "🇧🇷" },
    { name: "Japan", code: "JP", count: 65, flag: "🇯🇵" },
  ]

  const mockRevenue = [12, 19, 15, 22, 18, 25, 30, 28, 24, 32, 27, 35]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  if (loading || !mounted) {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="h-28" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card animate-pulse"><div className="h-72" /></div>
          <div className="glass-card animate-pulse"><div className="h-72" /></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {isOwner && <span className="owner-badge">👑 OWNER</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user.name || user.username}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            {userRole === "owner" ? "👑 LIFETIME" : "Premium Active"}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Clients" value={stats?.totalCustomers ? String(stats.totalCustomers) : "1,247"} change="+12.5%" icon="👥" color="primary" index={0} />
        <StatCard title="Online Now" value="89" change="+5.2%" icon="🟢" color="success" index={1} />
        <StatCard title="Offline" value="23" change="-3.1%" icon="🔴" color="muted" index={2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold">Distribution Map</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Client distribution by region</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary/60" />
                Active
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-success/60" />
                Online
              </span>
            </div>
          </div>
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden bg-muted/20">
            <svg viewBox="0 0 800 400" className="w-full h-full opacity-[0.15] dark:opacity-[0.08]">
              <path d="M200,100 Q250,80 300,100 Q350,120 400,100 Q450,80 500,100 Q550,120 600,100" stroke="currentColor" fill="none" strokeWidth="0.5" opacity="0.3" />
              <circle cx="300" cy="150" r="40" fill="currentColor" opacity="0.1" />
              <circle cx="500" cy="120" r="55" fill="currentColor" opacity="0.1" />
              <circle cx="420" cy="200" r="30" fill="currentColor" opacity="0.1" />
              <circle cx="200" cy="220" r="25" fill="currentColor" opacity="0.1" />
              <circle cx="600" cy="180" r="35" fill="currentColor" opacity="0.1" />
              <circle cx="350" cy="250" r="20" fill="currentColor" opacity="0.1" />
              <path d="M200,100 Q250,80 300,100 Q350,120 400,100 Q450,80 500,100 Q550,120 600,100 L600,200 Q550,220 500,200 Q450,180 400,200 Q350,220 300,200 Q250,180 200,200 Z" fill="url(#grad)" opacity="0.05" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-8">
                {[
                  { country: "US", color: "hsl(var(--primary) / 0.3)", intensity: 80 },
                  { country: "EU", color: "hsl(var(--primary) / 0.2)", intensity: 60 },
                  { country: "AS", color: "hsl(var(--primary) / 0.15)", intensity: 40 },
                  { country: "SA", color: "hsl(var(--primary) / 0.1)", intensity: 20 },
                ].map((r) => (
                  <div key={r.country} className="text-center">
                    <div
                      className="w-16 h-16 rounded-full mx-auto mb-2"
                      style={{
                        background: `radial-gradient(circle, ${r.color}, transparent 70%)`,
                        opacity: r.intensity / 100,
                      }}
                    />
                    <span className="text-[11px] text-muted-foreground">{r.country}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(stats?.totalRevenue || 28450)} total</p>
            </div>
            <select className="text-[11px] bg-muted/50 rounded-lg px-2 py-1 border border-border/30 text-muted-foreground">
              <option>7d</option>
              <option>30d</option>
              <option>12m</option>
            </select>
          </div>

          <div className="h-44 flex items-end gap-1.5">
            {months.map((m, i) => {
              const max = Math.max(...mockRevenue)
              const height = (mockRevenue[i] / max) * 100
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03, ease: "easeOut" }}
                    className="w-full rounded-md relative group-hover:opacity-80 transition-opacity cursor-pointer"
                    style={{
                      background: `linear-gradient(180deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.2))`,
                      minHeight: 4,
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded">
                      {formatCurrency(mockRevenue[i] * 1000)}
                    </div>
                  </motion.div>
                  <span className="text-[9px] text-muted-foreground">{m}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold">Connection History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days activity</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Connections
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-success" />
                Success
              </span>
            </div>
          </div>
          <div className="h-40 flex items-end gap-1">
            {[45, 52, 38, 65, 48, 55, 42, 58, 62, 40, 50, 35, 60, 44, 56, 70, 48, 52, 38, 65, 48, 55, 42, 58, 62, 40, 50, 35, 60, 44].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / 70) * 100}%` }}
                  transition={{ duration: 0.4, delay: i * 0.01 }}
                  className="w-full rounded-md"
                  style={{
                    background: i % 3 === 0
                      ? "hsl(var(--success) / 0.7)"
                      : "hsl(var(--primary) / 0.5)",
                    minHeight: 3,
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold">Top Countries</h3>
              <p className="text-xs text-muted-foreground mt-0.5">By client count</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {topCountries.map((c, i) => {
              const maxCount = topCountries[0].count
              const percent = (c.count / maxCount) * 100
              return (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="w-6 text-lg">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: i === 0
                            ? "hsl(var(--primary))"
                            : `hsl(var(--primary) / ${0.8 - i * 0.08})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
