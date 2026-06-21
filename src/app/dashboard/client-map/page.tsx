"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import dynamic from "next/dynamic"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const WorldMap = dynamic(() => import("../remote/clients/WorldMap"), { ssr: false })

function flag(code: string | null): string {
  if (!code || code.length !== 2) return "🏳"
  try { return String.fromCodePoint(0x1F1E6 + code.toUpperCase().charCodeAt(0) - 65, 0x1F1E6 + code.toUpperCase().charCodeAt(1) - 65) } catch { return "🏳" }
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const from = display
    const dur = 600
    function step(now: number) {
      const p = Math.min((now - start) / dur, 1)
      setDisplay(Math.floor(from + (value - from) * p))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <span>{display.toLocaleString()}</span>
}

export default function ClientMapPage() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState("24h")
  const [lastUpdate, setLastUpdate] = useState("")

  function fetchData(r?: string) {
    fetch(`/api/remote/stats?range=${r || range}`)
      .then(d => d.json()).then(d => { setData(d); setLastUpdate(new Date().toLocaleTimeString()) })
  }

  useEffect(() => { fetchData(); const t = setInterval(() => fetchData(), 8000); return () => clearInterval(t) }, [range])

  const s = data?.stats || { total: 0, online: 0, offline: 0 }
  const countries = data?.topCountries || []
  const chart = data?.chart || []
  const peak = chart.length ? Math.max(...chart.map((p: any) => p.online || 0)) : 0
  const avg = chart.length ? Math.round(chart.reduce((a: number, p: any) => a + (p.online || 0), 0) / chart.length) : 0

  const markers = (data?.clients || []).filter((c: any) => c.lat && c.lng).map((c: any) => ({
    id: c.id, clientId: c.clientId, lat: c.lat, lng: c.lng, label: c.hostname || c.clientId?.substring(0, 8),
    status: c.state, country: c.country, city: c.city, os: c.os, ip: c.ipPublic,
    lastSeen: c.lastHeartbeat ? "Active" : "—",
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">🌍</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Global Live Map</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              SOC Monitor · Refresh 8s · {lastUpdate}
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-muted/30 rounded-xl p-0.5">
          {["24h","7d","30d"].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-[10px] text-[11px] font-semibold transition-all ${range===r?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { v: s.total, l: "Total Clients", c: "#818cf8" },
          { v: s.online, l: "Online Now", c: "#22c55e" },
          { v: s.offline, l: "Offline", c: "#ef4444" },
          { v: countries.length, l: "Active Countries", c: "#3b82f6" },
        ].map(({ v, l, c }) => (
          <div key={l} className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-0.5 h-full" style={{ backgroundColor: c }} />
            <div className="text-2xl font-black" style={{ color: c }}>
              <AnimatedNumber value={v} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{l}</p>
          </div>
        ))}
      </div>

      {/* Map + Sidebar */}
      <div className="grid lg:grid-cols-4 gap-3">
        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl border border-border/40 overflow-hidden" style={{ background: "#0A1020", minHeight: "520px" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Global Map</h2>
              <span className="text-[10px] text-slate-500 font-mono">{markers.length} MARKERS · {s.online} ONLINE</span>
            </div>
          </div>
          <div style={{ height: "480px" }}><WorldMap markers={markers} /></div>
        </div>

        {/* Top Countries */}
        <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-4 flex flex-col">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Top Countries
          </h2>
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {countries.map((c: any, i: number) => (
              <div key={c.name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-foreground font-medium truncate flex items-center gap-1">
                    <span className="text-sm">{flag(c.code)}</span> {c.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{c.pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.max(c.pct,3)}%`,
                      background: `linear-gradient(90deg, ${["#60a5fa","#818cf8","#22c55e","#facc15","#f87171"][i]||"#475569"}, transparent)`,
                    }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-16 text-right shrink-0">
                    {c.total} <span className="text-blue-400">({c.online})</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Mini stats */}
          <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-2 text-[10px]">
            <div><span className="text-muted-foreground">Peak</span><div className="text-foreground font-bold">{peak}</div></div>
            <div><span className="text-muted-foreground">Avg</span><div className="text-foreground font-bold">{avg}</div></div>
            <div><span className="text-muted-foreground">Total</span><div className="text-foreground font-bold">{s.total}</div></div>
            <div><span className="text-muted-foreground">Online</span><div className="text-green-400 font-bold">{(s.total ? Math.round((s.online/s.total)*100) : 0)}%</div></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Connection History</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active online clients over time</p>
          </div>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,16,32,0.95)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", backdropFilter: "blur(12px)", fontSize: "12px", color: "#cbd5e1" }}
                labelStyle={{ fontWeight: "bold", color: "#60a5fa" }}
              />
              <Area type="monotone" dataKey="online" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" name="Online" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
