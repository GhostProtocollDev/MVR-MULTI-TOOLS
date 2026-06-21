"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge, Input, Button } from "@/components/ui"
import Link from "next/link"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./WorldMap"), { ssr: false })

function statusBadge(s: string) {
  const map: Record<string, { dot: string; color: string; bg: string; label: string }> = {
    online: { dot: "bg-green-500", color: "text-green-400", bg: "bg-green-500/10", label: "Online" },
    idle: { dot: "bg-yellow-500", color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Idle" },
    offline: { dot: "bg-red-500", color: "text-red-400", bg: "bg-red-500/10", label: "Offline" },
  }
  return map[s] || map.offline
}

function osIcon(os: string | null): string {
  if (!os) return "💻"
  const l = os.toLowerCase()
  if (l.includes("win") && l.includes("11")) return "🪟11"
  if (l.includes("win") && l.includes("10")) return "🪟10"
  if (l.includes("win")) return "🪟"
  if (l.includes("linux") || l.includes("ubuntu") || l.includes("debian")) return "🐧"
  if (l.includes("mac")) return "🍎"
  return "💻"
}

function getStatus(lastHb: string | null): { state: string; dot: string; color: string; bg: string; label: string } {
  if (!lastHb) return { state: "offline", ...statusBadge("offline") }
  const diff = (Date.now() - new Date(lastHb).getTime()) / 1000
  if (diff <= 90) return { state: "online", ...statusBadge("online") }
  if (diff <= 300) return { state: "idle", ...statusBadge("idle") }
  return { state: "offline", ...statusBadge("offline") }
}

function fmtAgo(d: string | null): string {
  if (!d) return "Never"
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 5) return "Just now"
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function flagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return ""
  try {
    const chars = code.toUpperCase().split("").map((c: string) => 0x1F1E6 + c.charCodeAt(0) - 65)
    return String.fromCodePoint(chars[0], chars[1])
  } catch { return "" }
}

export default function RemoteClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<any>(null)
  const [cmdInput, setCmdInput] = useState("")
  const [sending, setSending] = useState(false)
  const [polling, setPolling] = useState(true)

  const fetchClients = useCallback(async () => {
    try {
      const r = await fetch("/api/remote/clients")
      const d = await r.json()
      if (d.clients) setClients(d.clients)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients(); const t = setInterval(fetchClients, 5000); return () => clearInterval(t) }, [fetchClients])

  const onlineN = clients.filter(c => getStatus(c.lastHeartbeat).state === "online").length
  const idleN = clients.filter(c => getStatus(c.lastHeartbeat).state === "idle").length
  const offlineN = clients.filter(c => getStatus(c.lastHeartbeat).state === "offline").length

  const byCountry: Record<string, number> = {}
  clients.forEach(c => { const n = c.country || "Unknown"; byCountry[n] = (byCountry[n] || 0) + 1 })
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const mapMarkers = clients.filter(c => c.lat && c.lng).map(c => ({
    id: c.id, clientId: c.clientId, lat: c.lat, lng: c.lng,
    label: c.hostname || c.clientId?.substring(0, 8),
    status: getStatus(c.lastHeartbeat).state,
    country: c.country, city: c.city, lastSeen: fmtAgo(c.lastHeartbeat),
  }))

  const filtered = clients.filter(c => {
    if (statusFilter !== "all" && getStatus(c.lastHeartbeat).state !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (c.clientId + c.hostname + c.country + c.user + c.ipPublic + (c.os || "")).toLowerCase().includes(q)
  })

  async function sendCmd(cmd: string) {
    if (!selected || !cmd.trim()) return
    setSending(true)
    try {
      const r = await fetch(`/api/remote/clients/${selected.id}/command`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      })
      if (!r.ok) throw new Error("Failed")
      toast.success(`Sent: ${cmd.substring(0, 25)}`)
      setCmdInput("")
    } catch { toast.error("Failed") } finally { setSending(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Remote Clients</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time monitoring · Auto-refresh 5s</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setPolling(!polling); if (!polling) fetchClients() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              polling ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-muted text-muted-foreground border border-border"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${polling ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
            {polling ? "LIVE" : "PAUSED"}
          </button>
          <Button size="sm" onClick={fetchClients}>Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { v: clients.length, l: "Total", c: "bg-primary text-primary-foreground" },
          { v: onlineN, l: "Online", c: "bg-green-500/10 text-green-400" },
          { v: idleN, l: "Idle", c: "bg-yellow-500/10 text-yellow-400" },
          { v: offlineN, l: "Offline", c: "bg-red-500/10 text-red-400" },
          { v: topCountries.length, l: "Countries", c: "bg-blue-500/10 text-blue-400" },
        ].map(({ v, l, c }) => (
          <motion.div key={l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
            <span className={`text-3xl font-bold ${c.split(" ")[1]}`}>{v}</span>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">{l}</p>
          </motion.div>
        ))}
      </div>

      {/* Map + Countries */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">🌍 Client Map</h2>
            <span className="text-[10px] text-muted-foreground">{mapMarkers.length} on map</span>
          </div>
          <div className="h-[400px]"><MapComponent markers={mapMarkers} /></div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">📊 Top Countries</h2>
          <div className="space-y-2">
            {topCountries.map(([c, n]) => (
              <div key={c} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate mr-2">{c}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-muted rounded-full w-20 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(n / clients.length) * 100}%` }} />
                  </div>
                  <span className="text-muted-foreground font-mono w-6 text-right">{n}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1.5">
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Status</h3>
            {[
              { s: "online", dot: "bg-green-500", l: "Online ≤ 90s" },
              { s: "idle", dot: "bg-yellow-500", l: "Idle ≤ 5min" },
              { s: "offline", dot: "bg-red-500", l: "Offline > 5min" },
            ].map(x => (
              <div key={x.s} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${x.dot} ${x.s === "online" ? "animate-pulse" : ""}`} />
                {x.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border/50">
          <div className="flex gap-1">
            {["all", "online", "idle", "offline"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium uppercase transition-all ${
                  statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>{s}</button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/50 bg-background/50 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-[11px] uppercase tracking-wider">
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Country</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Hostname</th>
                <th className="text-left p-3 font-medium">IP</th>
                <th className="text-left p-3 font-medium">OS</th>
                <th className="text-left p-3 font-medium">CPU</th>
                <th className="text-left p-3 font-medium">RAM</th>
                <th className="text-left p-3 font-medium">Last Seen</th>
                <th className="text-right p-3 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No clients found</td></tr>
              ) : (
                filtered.map(c => {
                  const st = getStatus(c.lastHeartbeat)
                  const flag = flagEmoji(c.countryCode)
                  return (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors text-xs cursor-pointer"
                      onClick={() => setSelected(c)}>
                      {/* Status */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${st.bg} ${st.color} border`}
                          style={{ borderColor: "currentColor", opacity: 0.3 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${st.state === "online" ? "animate-pulse" : ""}`} />
                          {st.label}
                        </span>
                      </td>
                      {/* Country */}
                      <td className="p-3">
                        <span className="text-foreground">{flag} {c.country || "—"}</span>
                      </td>
                      {/* User */}
                      <td className="p-3">
                        <span className="text-foreground font-medium">{c.user || "—"}</span>
                      </td>
                      {/* Hostname */}
                      <td className="p-3">
                        <span className="text-foreground font-mono text-[11px]">{c.hostname || c.clientId?.substring(0, 8)}</span>
                      </td>
                      {/* IP */}
                      <td className="p-3">
                        <code className="text-muted-foreground text-[11px]">{c.ipPublic || "—"}</code>
                      </td>
                      {/* OS */}
                      <td className="p-3">
                        <span className="text-muted-foreground">{osIcon(c.os)} {c.os || "—"}</span>
                      </td>
                      {/* CPU */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-muted rounded-full w-16 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${c.cpu || 0}%`,
                              backgroundColor: (c.cpu || 0) > 80 ? "hsl(var(--destructive))" : (c.cpu || 0) > 50 ? "hsl(var(--warning))" : "hsl(var(--primary))",
                            }} />
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px] w-8">{c.cpu != null ? `${c.cpu.toFixed(0)}%` : "—"}</span>
                        </div>
                      </td>
                      {/* RAM */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-muted rounded-full w-16 overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{
                              width: c.ramTotal ? `${((c.ramUsed || 0) / c.ramTotal) * 100}%` : "0%",
                            }} />
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px] w-12">
                            {c.ramTotal ? `${(c.ramUsed || 0).toFixed(1)}/${c.ramTotal.toFixed(1)}G` : "—"}
                          </span>
                        </div>
                      </td>
                      {/* Last Seen */}
                      <td className="p-3">
                        <span className="text-muted-foreground">{fmtAgo(c.lastHeartbeat)}</span>
                      </td>
                      {/* Manage */}
                      <td className="p-3 text-right">
                        <Link href={`/dashboard/remote/clients/${c.id}`}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Client Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selected.hostname || selected.clientId?.substring(0, 8)}</h2>
                  <p className="text-xs text-muted-foreground">{selected.ipPublic} · {selected.country}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                {[
                  { l: "User", v: selected.user }, { l: "OS", v: selected.os }, { l: "IP", v: selected.ipPublic },
                  { l: "Country", v: `${flagEmoji(selected.countryCode)} ${selected.country || "—"}` }, { l: "City", v: selected.city },
                  { l: "ISP", v: selected.isp }, { l: "CPU", v: selected.cpu != null ? `${selected.cpu.toFixed(1)}%` : "—" },
                  { l: "RAM", v: selected.ramTotal ? `${(selected.ramUsed || 0).toFixed(1)} / ${selected.ramTotal.toFixed(1)} GB` : "—" },
                  { l: "Screen", v: selected.screenWidth ? `${selected.screenWidth}x${selected.screenHeight}` : "—" },
                  { l: "Status", v: getStatus(selected.lastHeartbeat).label },
                  { l: "Last Seen", v: fmtAgo(selected.lastHeartbeat) },
                  { l: "First Seen", v: new Date(selected.firstSeen).toLocaleDateString() },
                ].map(({ l, v }) => (
                  <div key={l} className="p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">{l}:</span> <span className="text-foreground font-mono">{v || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Quick command */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Command</p>
                <form onSubmit={e => { e.preventDefault(); sendCmd(cmdInput) }} className="flex gap-2">
                  <input value={cmdInput} onChange={e => setCmdInput(e.target.value)}
                    placeholder="!sysinfo or !screenshot..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-xs text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
                  <Button type="submit" size="sm" loading={sending} disabled={!cmdInput.trim()}>Send</Button>
                </form>
                <div className="flex flex-wrap gap-1">
                  {["!sysinfo", "!screenshot", "!steal", "!wifi", "!beep"].map(c => (
                    <button key={c} onClick={() => { setCmdInput(c); sendCmd(c) }}
                      className="px-2 py-1 rounded-md text-[10px] text-muted-foreground bg-muted/30 hover:bg-muted font-mono">{c}</button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/remote/clients/${selected.id}`}
                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium text-center transition-colors">Full Detail →</Link>
                <button onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
