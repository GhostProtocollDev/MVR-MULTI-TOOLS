"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import dynamic from "next/dynamic"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const WorldMap = dynamic(() => import("../remote/clients/WorldMap"), { ssr: false })

function flag(code: string | null): string {
  if (!code || code.length !== 2) return ""
  try { return String.fromCodePoint(0x1F1E6 + code.toUpperCase().charCodeAt(0) - 65, 0x1F1E6 + code.toUpperCase().charCodeAt(1) - 65) } catch { return "" }
}

export default function ClientMapPage() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState("24h")
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState("")

  function fetchData(r?: string) {
    fetch(`/api/remote/stats?range=${r || range}`)
      .then(d => d.json())
      .then(d => { setData(d); setLastUpdate(new Date().toLocaleTimeString()) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(); const t = setInterval(() => fetchData(), 10000); return () => clearInterval(t) }, [range])

  const s = data?.stats || { total: 0, online: 0, offline: 0 }
  const countries = data?.topCountries || []

  const mapMarkers = (data?.clients || []).filter((c: any) => c.lat && c.lng).map((c: any) => ({
    id: c.id, clientId: c.clientId, lat: c.lat, lng: c.lng,
    label: c.hostname || c.clientId?.substring(0, 8),
    status: c.state, country: c.country, city: c.city,
    lastSeen: c.lastHeartbeat ? "Online" : "Offline",
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🌍 Client Distribution Map</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time global client monitoring · Auto-refresh 10s · {lastUpdate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => fetchData()}>Refresh</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: s.total, l: "Total Clients", c: "text-primary", bg: "bg-primary/5" },
          { v: s.online, l: "Online Now", c: "text-green-400", bg: "bg-green-500/5" },
          { v: s.offline, l: "Offline", c: "text-red-400", bg: "bg-red-500/5" },
          { v: countries.length, l: "Countries", c: "text-blue-400", bg: "bg-blue-500/5" },
        ].map(({ v, l, c, bg }) => (
          <div key={l} className={`rounded-2xl border border-border/50 ${bg} backdrop-blur-sm p-5`}>
            <span className={`text-3xl font-black ${c}`}>{v}</span>
            <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-wider">{l}</p>
          </div>
        ))}
      </div>

      {/* Map + Countries Sidebar */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Map — 3/4 width */}
        <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Client Map</h2>
            <span className="text-[10px] text-muted-foreground">{mapMarkers.length} clients on map</span>
          </div>
          <div className="h-[480px]">
            <WorldMap markers={mapMarkers} />
          </div>
        </div>

        {/* Top Countries — 1/4 width */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Top Countries</h2>
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {countries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (
              countries.map((c: any, i: number) => (
                <div key={c.name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground truncate">
                      <span className="mr-1.5">{flag(c.code)}</span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px]">{c.pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono w-16 text-right">
                      {c.total} <span className="text-green-400">({c.online})</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Connection History Chart */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Connection History</h2>
          <div className="flex gap-1">
            {["24h", "7d", "30d"].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${range === r ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
            ))}
          </div>
        </div>
        <div className="h-[250px]">
          {data?.chart ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="online" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Online" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading chart...</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
