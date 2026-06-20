'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, Badge } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"

function StatCard({ title, value, icon, color, sub }: { title: string; value: string; icon: string; color: string; sub?: string }) {
  return (
    <div className="premium-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{sub}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
  }, [])

  const stats = [
    { title: "Total Users", value: String(data?.newCustomers || 0), icon: "👥", color: "bg-primary/10 text-primary", sub: "All time" },
    { title: "Active Users", value: String(data?.activeCustomers || 0), icon: "✅", color: "bg-success/10 text-success", sub: "Active" },
    { title: "Banned Users", value: "0", icon: "🚫", color: "bg-destructive/10 text-destructive", sub: "Suspended" },
    { title: "Active Licenses", value: String(data?.activeLicenses || 0), icon: "🔑", color: "bg-success/10 text-success", sub: "Active" },
    { title: "Expired Licenses", value: String(data?.expiredLicenses || 0), icon: "⏰", color: "bg-warning/10 text-warning", sub: "Expired" },
    { title: "Lifetime Licenses", value: String(data?.lifetimeCustomers || 0), icon: "🌟", color: "bg-yellow-500/10 text-yellow-500", sub: "Lifetime" },
    { title: "Total Revenue", value: formatCurrency(data?.totalRevenue || 0), icon: "💰", color: "bg-success/10 text-success", sub: "All time" },
    { title: "Connected Devices", value: "0", icon: "📱", color: "bg-blue-500/10 text-blue-500", sub: "Active" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Advanced platform metrics and insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {data?.revenueData ? (
              <div className="w-full h-full flex items-end gap-2">
                {data.revenueData.map((d: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.revenue / Math.max(...data.revenueData.map((x: any) => x.revenue))) * 100}%` }}
                      className="w-full rounded-md bg-gradient-to-t from-primary/80 to-primary/30"
                      style={{ minHeight: 4 }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span>Loading chart data...</span>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Top Selling Plans</h3>
          <div className="space-y-4">
            {data?.topSellingPlans?.map((plan: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>{plan.name}</span>
                  <span className="text-muted-foreground">{plan.sales} sales</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(plan.sales / Math.max(...data.topSellingPlans.map((x: any) => x.sales))) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
