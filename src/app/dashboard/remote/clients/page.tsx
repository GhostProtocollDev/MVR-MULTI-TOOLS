'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge, Input, Button } from "@/components/ui"
import Link from "next/link"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./WorldMap"), { ssr: false })

function getStatus(lastHeartbeat: string | null): { status: string; color: string; dot: string } {
  if (!lastHeartbeat) return { status: "offline", color: "#ef4444", dot: "🔴" }
  const diff = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000
  if (diff <= 90) return { status: "online", color: "#22c55e", dot: "🟢" }
  if (diff <= 300) return { status: "idle", color: "#eab308", dot: "🟡" }
  return { status: "offline", color: "#ef4444", dot: "🔴" }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function AnimatedCounter({ value, label, color }: { value: number; label: string; color: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const duration = 800
    const from = display
    function step(now: number) {
      const pct = Math.min((now - start) / duration, 1)
      setDisplay(Math.floor(from + (value - from) * pct))
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm"
    >
      <span className="text-4xl font-bold" style={{ color }}>{display.toLocaleString()}</span>
      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{label}</p>
    </motion.div>
  )
}

export default function RemoteClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [manageCmd, setManageCmd] = useState("")
  const [manageOutput, setManageOutput] = useState("")
  const [manageTab, setManageTab] = useState<"info" | "terminal" | "screenshot">("info")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [polling, setPolling] = useState(true)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/remote/clients")
      const data = await res.json()
      if (data.clients) setClients(data.clients)
      if (data.stats) setStats(data.stats)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, countries: [] as { country: string; count: number }[] })

  // Auto-refresh every 5 seconds (real-time)
  useEffect(() => {
    fetchClients()
    const t = setInterval(fetchClients, 5000)
    return () => clearInterval(t)
  }, [fetchClients])

  // Send command to selected client
  async function sendCommand(cmd: string) {
    if (!selectedClient || !cmd.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/remote/clients/${selectedClient.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`Sent: ${cmd.substring(0, 30)}`)
      setManageOutput(`> ${cmd}\n${"Sent successfully — waiting for client response..."}`)
      setManageCmd("")
    } catch {
      toast.error("Failed to send command")
    } finally { setSending(false) }
  }

  // Filtered clients
  const filtered = clients.filter(c => {
    const status = getStatus(c.lastHeartbeat).status
    if (statusFilter !== "all" && status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.clientId?.toLowerCase().includes(q) ||
        c.hostname?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q) ||
        c.user?.toLowerCase().includes(q) ||
        c.ipPublic?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Calculate stats with real heartbeat data
  const onlineCount = clients.filter(c => getStatus(c.lastHeartbeat).status === "online").length
  const idleCount = clients.filter(c => getStatus(c.lastHeartbeat).status === "idle").length
  const offlineCount = clients.filter(c => getStatus(c.lastHeartbeat).status === "offline").length

  // Country grouping
  const byCountry: Record<string, number> = {}
  clients.forEach(c => { const n = c.country || "Unknown"; byCountry[n] = (byCountry[n] || 0) + 1 })
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Map markers for all clients with geo data
  const mapMarkers = clients
    .filter(c => c.lat && c.lng)
    .map(c => ({
      id: c.id,
      clientId: c.clientId,
      lat: c.lat,
      lng: c.lng,
      label: c.hostname || c.clientId?.substring(0, 8),
      status: getStatus(c.lastHeartbeat).status,
      country: c.country,
      city: c.city,
      lastSeen: formatTimeAgo(c.lastHeartbeat),
    }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Remote Clients</h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time monitoring dashboard · Auto-refresh 5s</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPolling(!polling); if (!polling) fetchClients() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${polling ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${polling ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
            {polling ? "LIVE" : "PAUSED"}
          </button>
          <Button size="sm" onClick={fetchClients}>Refresh</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <AnimatedCounter value={clients.length} label="Total Clients" color="#8b5cf6" />
        <AnimatedCounter value={onlineCount} label="Online" color="#22c55e" />
        <AnimatedCounter value={idleCount} label="Idle" color="#eab308" />
        <AnimatedCounter value={offlineCount} label="Offline" color="#ef4444" />
        <AnimatedCounter value={topCountries.length} label="Countries" color="#3b82f6" />
      </div>

      {/* World Map + Geo Analytics */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">🌍 Client Distribution Map</h2>
            <span className="text-[10px] text-zinc-500">{mapMarkers.length} clients on map</span>
          </div>
          <div className="h-[420px]">
            <MapComponent markers={mapMarkers} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">📊 Top Countries</h2>
          {topCountries.length === 0 ? (
            <p className="text-xs text-zinc-500">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 truncate mr-2">{country}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-zinc-800 rounded-full w-24 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((count / clients.length) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Status Legend</h3>
            {[
              { dot: "🟢", label: "Online", desc: "Last heartbeat ≤ 90s", color: "#22c55e" },
              { dot: "🟡", label: "Idle", desc: "Last heartbeat ≤ 5min", color: "#eab308" },
              { dot: "🔴", label: "Offline", desc: "Last heartbeat > 5min", color: "#ef4444" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span>{item.dot}</span>
                <span style={{ color: item.color }} className="font-medium">{item.label}</span>
                <span className="text-zinc-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-zinc-800">
          <div className="flex gap-1">
            {["all", "online", "idle", "offline"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium uppercase transition-all ${
                  statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative w-60">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Computer</th>
                <th className="text-left p-3 font-medium">IP</th>
                <th className="text-left p-3 font-medium">Country</th>
                <th className="text-left p-3 font-medium">OS</th>
                <th className="text-left p-3 font-medium">Last Seen</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-zinc-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-zinc-500">No clients found</td></tr>
              ) : (
                filtered.map(client => {
                  const { status, color, dot } = getStatus(client.lastHeartbeat)
                  return (
                    <tr key={client.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors text-xs">
                      <td className="p-3">
                        <span className="font-mono text-zinc-300">{client.clientId?.substring(0, 8)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-zinc-300">{client.hostname || "-"}</span>
                        {client.user && <span className="text-zinc-500 block text-[10px]">{client.user}</span>}
                      </td>
                      <td className="p-3 font-mono text-zinc-400">{client.ipPublic || "-"}</td>
                      <td className="p-3">
                        <span className="text-zinc-300">{client.country || "-"}</span>
                        {client.city && <span className="text-zinc-500 block text-[10px]">{client.city}</span>}
                      </td>
                      <td className="p-3 text-zinc-400">{client.os || "-"}</td>
                      <td className="p-3 text-zinc-500">{formatTimeAgo(client.lastHeartbeat)}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: status === "online" ? "pulse 2s infinite" : "none" }} />
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/dashboard/remote/clients/${client.id}`} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors">
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

      {/* Quick Command - Selected Client Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedClient.hostname || selectedClient.clientId?.substring(0, 8)}</h2>
                  <p className="text-xs text-zinc-400">{selectedClient.ipPublic} · {selectedClient.country}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex gap-1 mb-4">
                {["info", "terminal", "screenshot"].map(t => (
                  <button
                    key={t}
                    onClick={() => setManageTab(t as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${manageTab === t ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white"}`}
                  >{t}</button>
                ))}
              </div>
              {manageTab === "info" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { l: "Client ID", v: selectedClient.clientId },
                    { l: "Hostname", v: selectedClient.hostname },
                    { l: "User", v: selectedClient.user },
                    { l: "OS", v: selectedClient.os },
                    { l: "IP Public", v: selectedClient.ipPublic },
                    { l: "IP Local", v: selectedClient.ipLocal },
                    { l: "Country", v: selectedClient.country },
                    { l: "City", v: selectedClient.city },
                    { l: "ISP", v: selectedClient.isp },
                    { l: "CPU", v: selectedClient.cpu ? `${selectedClient.cpu.toFixed(1)}%` : "-" },
                    { l: "RAM", v: selectedClient.ramTotal ? `${(selectedClient.ramUsed || 0).toFixed(1)} / ${selectedClient.ramTotal.toFixed(1)} GB` : "-" },
                    { l: "Screen", v: selectedClient.screenWidth ? `${selectedClient.screenWidth}x${selectedClient.screenHeight}` : "-" },
                    { l: "Status", v: getStatus(selectedClient.lastHeartbeat).dot + " " + getStatus(selectedClient.lastHeartbeat).status },
                    { l: "Last Heartbeat", v: formatTimeAgo(selectedClient.lastHeartbeat) },
                  ].map(({ l, v }) => (
                    <div key={l} className="p-2 rounded-lg bg-zinc-800/30"><span className="text-zinc-500">{l}: </span><span className="text-zinc-300 font-mono">{v || "-"}</span></div>
                  ))}
                </div>
              )}
              {manageTab === "terminal" && (
                <div className="space-y-3">
                  <div className="bg-black/80 rounded-lg p-3 font-mono text-xs text-green-400 min-h-[100px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                    {manageOutput || "Ready. Type a command and press Send."}
                  </div>
                  <form onSubmit={e => { e.preventDefault(); sendCommand(manageCmd) }} className="flex gap-2">
                    <input value={manageCmd} onChange={e => setManageCmd(e.target.value)} placeholder="!sysinfo or !screenshot..." className="input-premium flex-1 font-mono text-xs" />
                    <Button type="submit" size="sm" loading={sending} disabled={!manageCmd.trim()}>Send</Button>
                  </form>
                </div>
              )}
              {manageTab === "screenshot" && (
                <div className="text-center">
                  <Button onClick={() => { sendCommand("!screenshot"); toast.success("Screenshot requested") }}>Request Screenshot</Button>
                  {selectedClient.screenCaptures?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {selectedClient.screenCaptures.slice(-4).map((sc: any) => (
                        <img key={sc.id} src={sc.imagePath} alt="Screen" className="rounded-lg border border-zinc-700 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage(sc.imagePath)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl border border-zinc-700" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  )
}
