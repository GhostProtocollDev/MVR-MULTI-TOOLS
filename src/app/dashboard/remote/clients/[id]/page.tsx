'use client'

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, Badge, Button, Input } from "@/components/ui"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "terminal" | "files" | "screenshots">("overview")
  const [command, setCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/remote/clients/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client)
        setCommandHistory(data.client?.commands || [])
      })
      .catch(() => toast.error("Failed to load client"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSendCommand() {
    if (!command.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/remote/clients/${params.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Command sent to client")
      setCommandHistory((prev) => [{ command, status: "pending", executedAt: new Date().toISOString() }, ...prev])
      setCommand("")
    } catch {
      toast.error("Failed to send command")
    } finally {
      setSending(false)
    }
  }

  async function handleRequestScreenshot() {
    try {
      const res = await fetch(`/api/remote/clients/${params.id}/screenshot`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Screenshot requested")
    } catch {
      toast.error("Failed to request screenshot")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => router.push("/dashboard/remote/clients")} className="mt-4">Back</Button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "terminal" as const, label: "Terminal", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
    { id: "files" as const, label: "Files", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
    { id: "screenshots" as const, label: "Screenshots", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/remote/clients")} className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.hostname || client.clientId}</h1>
            <p className="text-sm text-muted-foreground">{client.ipPublic} · {client.os}</p>
          </div>
        </div>
        <Badge variant={client.status === "online" ? "success" : "secondary"}>
          {client.status === "online" ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="flex gap-1 p-1 glass rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">System Info</h3>
            <div className="space-y-3">
              {[
                { label: "Hostname", value: client.hostname },
                { label: "User", value: client.user },
                { label: "OS", value: client.os },
                { label: "Version", value: client.version },
                { label: "Hardware ID", value: client.hardwareId },
                { label: "Client ID", value: client.clientId },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-mono font-medium">{item.value || "-"}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span className="font-mono font-medium">{client.cpu != null ? `${client.cpu.toFixed(1)}%` : "-"}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${client.cpu || 0}%`,
                    backgroundColor: (client.cpu || 0) > 80 ? "hsl(var(--destructive))" : (client.cpu || 0) > 50 ? "hsl(var(--warning))" : "hsl(var(--primary))",
                  }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">RAM Usage</span>
                  <span className="font-mono font-medium">
                    {client.ramTotal ? `${(client.ramUsed || 0).toFixed(1)}GB / ${client.ramTotal.toFixed(1)}GB` : "-"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: client.ramTotal ? `${(client.ramUsed || 0) / client.ramTotal * 100}%` : "0%",
                    backgroundColor: "hsl(var(--primary))",
                  }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Screen</span>
                <span className="font-mono font-medium">{client.screenWidth ? `${client.screenWidth}x${client.screenHeight}` : "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Builder</span>
                <span className="font-medium">{client.builder?.name || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verified</span>
                <span className={client.isVerified ? "text-success" : "text-destructive"}>{client.isVerified ? "Yes" : "No"}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Network</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Public IP</span>
                <span className="font-mono font-medium">{client.ipPublic || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Local IP</span>
                <span className="font-mono font-medium">{client.ipLocal || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="font-medium">{client.country || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Seen</span>
                <span className="font-medium">{new Date(client.firstSeen).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Seen</span>
                <span className="font-medium">{new Date(client.lastSeen).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRequestScreenshot}
                className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm text-left"
              >
                <span className="text-lg block mb-1">📸</span>
                <span className="font-medium">Screenshot</span>
                <span className="block text-xs text-muted-foreground">Capture now</span>
              </button>
              <button
                onClick={() => setActiveTab("terminal")}
                className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm text-left"
              >
                <span className="text-lg block mb-1">💻</span>
                <span className="font-medium">Terminal</span>
                <span className="block text-xs text-muted-foreground">Run commands</span>
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm text-left"
              >
                <span className="text-lg block mb-1">📁</span>
                <span className="font-medium">File Explorer</span>
                <span className="block text-xs text-muted-foreground">Browse files</span>
              </button>
              <button
                onClick={() => toast.success("Streaming feature coming soon")}
                className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm text-left"
              >
                <span className="text-lg block mb-1">📺</span>
                <span className="font-medium">Screen Stream</span>
                <span className="block text-xs text-muted-foreground">WebRTC (soon)</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "terminal" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Remote Terminal</h3>
          <div
            ref={terminalRef}
            className="bg-black/80 rounded-xl p-4 font-mono text-sm max-h-80 overflow-y-auto mb-4 space-y-1"
          >
            {commandHistory.length === 0 ? (
              <span className="text-muted-foreground">No commands executed yet.</span>
            ) : (
              commandHistory.map((cmd, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <span className="text-success">$</span>
                    <span className="text-foreground">{cmd.command}</span>
                  </div>
                  <div className="text-muted-foreground pl-4 text-xs">
                    {cmd.status === "pending" ? "⏳ Pending execution..." : cmd.output || "✅ Executed"}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSendCommand() }} className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              className="input-premium flex-1 font-mono text-sm"
            />
            <Button type="submit" disabled={sending || !command.trim()}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "files" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">File Transfers</h3>
          {client.fileTransfers?.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">📁</span>
              <p className="text-muted-foreground">No file transfers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">File</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Direction</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Size</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Progress</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {client.fileTransfers?.map((ft: any) => (
                    <tr key={ft.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-sm font-mono">{ft.fileName}</td>
                      <td className="p-3">
                        <Badge variant={ft.direction === "upload" ? "primary" : "warning"}>
                          {ft.direction === "upload" ? "⬆ Upload" : "⬇ Download"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{ft.fileSize ? `${(ft.fileSize / 1024).toFixed(1)}KB` : "-"}</td>
                      <td className="p-3">
                        <Badge variant={ft.status === "completed" ? "success" : ft.status === "failed" ? "danger" : "warning"}>
                          {ft.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${ft.progress || 0}%` }} />
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(ft.startedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "screenshots" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Screen Captures</h3>
            <Button size="sm" onClick={handleRequestScreenshot}>Request Screenshot</Button>
          </div>
          {client.screenCaptures?.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">📸</span>
              <p className="text-muted-foreground">No screenshots captured yet</p>
              <Button onClick={handleRequestScreenshot} className="mt-4" size="sm">Request First Screenshot</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {client.screenCaptures?.map((sc: any) => (
                <div key={sc.id} className="border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors">
                  {sc.imagePath ? (
                    <img src={sc.imagePath} alt={`Screenshot ${sc.id}`} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      Awaiting upload
                    </div>
                  )}
                  <div className="p-2 text-xs text-muted-foreground flex justify-between">
                    <span>{sc.width ? `${sc.width}x${sc.height}` : "-"}</span>
                    <span>{new Date(sc.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {client.sessions?.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Session History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">IP</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Connected</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Disconnected</th>
                </tr>
              </thead>
              <tbody>
                {client.sessions.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 text-sm">
                    <td className="p-3">{s.type}</td>
                    <td className="p-3"><Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge></td>
                    <td className="p-3 font-mono text-xs">{s.ip || "-"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(s.connectedAt).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground text-xs">{s.disconnectedAt ? new Date(s.disconnectedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
