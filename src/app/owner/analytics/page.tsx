'use client'

import { motion } from "framer-motion"

export default function OwnerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Analytics</h1>
        <p className="text-zinc-400 text-sm mt-1">Complete platform analytics and financial data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: "$12,450", change: "+8.2%", color: "text-green-400" },
          { label: "ARR", value: "$149,400", change: "+12.5%", color: "text-green-400" },
          { label: "LTV", value: "$892", change: "+5.1%", color: "text-green-400" },
          { label: "Churn Rate", value: "3.2%", change: "-0.8%", color: "text-red-400" },
          { label: "Conversion Rate", value: "18.7%", change: "+2.1%", color: "text-green-400" },
          { label: "Avg Session", value: "14m 32s", change: "+1.2m", color: "text-green-400" },
          { label: "Total Licenses", value: "1,847", change: "+234", color: "text-blue-400" },
          { label: "Active Users", value: "892", change: "+67", color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">{stat.label}</div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-zinc-600 mt-1">{stat.change} this month</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {[
              { plan: "Professional", revenue: 12450, percent: 58, color: "bg-red-500" },
              { plan: "Enterprise", revenue: 7890, percent: 27, color: "bg-purple-500" },
              { plan: "Starter", revenue: 3450, percent: 15, color: "bg-blue-500" },
            ].map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-300">{p.plan}</span>
                  <span className="text-zinc-400">${p.revenue.toLocaleString("en-US")}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: `${p.percent}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${p.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Platform Health</h3>
          <div className="space-y-4">
            {[
              { metric: "API Uptime", value: "99.99%", status: "operational" },
              { metric: "Database Response", value: "12ms", status: "operational" },
              { metric: "Cache Hit Rate", value: "94.2%", status: "operational" },
              { metric: "Error Rate", value: "0.02%", status: "operational" },
              { metric: "Avg Page Load", value: "1.2s", status: "operational" },
              { metric: "Server Load", value: "23%", status: "operational" },
            ].map((h) => (
              <div key={h.metric} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-zinc-300">{h.metric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">{h.value}</span>
                  <span className="text-[10px] text-green-400 uppercase">{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
