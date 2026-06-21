"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import dynamic from "next/dynamic"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const WorldMap = dynamic(() => import("../remote/clients/WorldMap"), { ssr: false })

function flag(code: string | null): string {
  if (!code || code.length !== 2) return "🏳"
  try { return String.fromCodePoint(0x1F1E6 + code.toUpperCase().charCodeAt(0) - 65, 0x1F1E6 + code.toUpperCase().charCodeAt(1) - 65) } catch { return "🏳" }
}

export default function ClientMapPage() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState("24h")
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState("")

  function fetchData(r?: string) {
    fetch(`/api/remote/stats?range=${r || range}`)
      .then(d => d.json()).then(d => { setData(d); setLastUpdate(new Date().toLocaleTimeString()) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(); const t = setInterval(() => fetchData(), 10000); return () => clearInterval(t) }, [range])

  const s = data?.stats || { total: 0, online: 0, offline: 0 }
  const countries = data?.topCountries || []
  const chart = data?.chart || []
  const peak = chart.length ? Math.max(...chart.map((p: any) => p.online || 0)) : 0
  const avg = chart.length ? Math.round(chart.reduce((a: number, p: any) => a + (p.online || 0), 0) / chart.length) : 0

  const mapMarkers = (data?.clients || []).filter((c: any) => c.lat && c.lng).map((c: any) => ({
    id: c.id, clientId: c.clientId, lat: c.lat, lng: c.lng, label: c.hostname || c.clientId?.substring(0, 8),
    status: c.state, country: c.country, city: c.city, os: c.os, ip: c.ipPublic,
    lastSeen: c.lastHeartbeat ? "Active" : "—",
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-8">
      {/* Header - SOC Style */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">🌍</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Client Distribution Map</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live · {lastUpdate}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => fetchData()} variant="outline">Refresh</Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: s.total, l: "Total Clients", sub: "registered", c: "#8b5cf6" },
          { v: s.online, l: "Online Now", sub: `${s.total ? Math.round((s.online / s.total) * 100) : 0}% of total`, c: "#22c55e" },
          { v: s.offline, l: "Offline", sub: `${s.total ? Math.round((s.offline / s.total) * 100) : 0}% of total`, c: "#ef4444" },
          { v: countries.length, l: "Countries", sub: "active regions", c: "#3b82f6" },
        ].map(({ v, l, sub, c }) => (
          <div key={l} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: c }} />
            <span className="text-3xl font-black" style={{ color: c }}>{v.toLocaleString()}</span>
            <p className="text-sm font-semibold text-foreground mt-1">{l}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* MAP - FULL WIDTH */}
        <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Live Global Map</h2>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{mapMarkers.length} MARKERS · {s.online} ONLINE</span>
          </div>
          <div className="h-[520px]"><WorldMap markers={mapMarkers} /></div>
        </div>

        {/* TOP COUNTRIES SIDEBAR */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />Top Countries
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {countries.map((c: any, i: number) => (
              <div key={c.name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-medium truncate flex items-center gap-1.5">
                    <span className="text-sm">{flag(c.code)}</span>
                    <span className="text-muted-foreground text-[10px]">{c.code || "—"}</span>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{c.pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.max(c.pct, 2)}%`,
                      background: `linear-gradient(90deg, ${i === 0 ? "#8b5cf6" : i === 1 ? "#3b82f6" : i === 2 ? "#22c55e" : "#6b7280"}, transparent)`,
                    }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-20 text-right shrink-0">
                    {c.total} total <span className="text-green-400 ml-0.5">({c.online} online)</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection History Chart */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Connection History</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Online clients over time</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Mini metrics */}
            <div className="hidden md:flex items-center gap-4 text-[10px]">
              <div className="text-center"><span className="text-primary font-bold block">{peak}</span><span className="text-muted-foreground">Peak</span></div>
              <div className="text-center"><span className="text-green-400 font-bold block">{avg}</span><span className="text-muted-foreground">Avg</span></div>
              <div className="text-center"><span className="text-muted-foreground font-bold block">{s.total}</span><span className="text-muted-foreground">Total</span></div>
            </div>
            <div className="flex gap-1 bg-muted/30 rounded-xl p-0.5">
              {["24h", "7d", "30d"].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all ${range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="onlineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card) / 0.95)", border: "1px solid hsl(var(--border))",
                  borderRadius: "16px", backdropFilter: "blur(12px)", fontSize: "12px", color: "hsl(var(--foreground))",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Area type="monotone" dataKey="online" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#onlineGrad)" name="Online" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
