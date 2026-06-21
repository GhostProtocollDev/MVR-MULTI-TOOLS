'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"

export default function DiscordLoginPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "GHOST TOKEN LOGIN engine initialized..."
  ])

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString()
    setConsoleLines(prev => [...prev, `[${ts}] ${msg}`])
  }

  async function handleVerify() {
    if (!token.trim()) return
    setLoading(true)
    setError("")
    setUserData(null)
    addLog(`Token received (${token.length} chars)`)
    try {
      addLog("Validating with Discord API...")
      const res = await fetch("https://discord.com/api/v9/users/@me", {
        headers: { Authorization: token.trim() },
      })
      if (res.status === 401) { setError("Invalid or expired token"); addLog("ERROR: 401 Unauthorized"); return }
      if (!res.ok) { setError(`Discord API error: ${res.status}`); addLog(`ERROR: API ${res.status}`); return }
      const data = await res.json()
      setUserData(data)
      addLog(`SUCCESS: ${data.username}#${data.discriminator || '0'} authenticated`)
    } catch {
      setError("Network error. Check your connection.")
      addLog("ERROR: Network failure")
    } finally { setLoading(false) }
  }

  function getNitroLabel(type: number): string {
    if (type === 2) return "Nitro (Tier 2)"
    if (type === 1) return "Nitro Classic"
    return "None"
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-purple-500/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-4rem)]">
        {/* Left Panel - User Info Card */}
        <div className="lg:w-[380px] bg-card/40 backdrop-blur-xl border-r border-border/50 flex flex-col p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl scale-150 animate-pulse" />
              <div className="w-44 h-44 rounded-full border-[3px] border-primary/60 bg-card/80 flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)]">
                {userData?.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-16 h-16 text-primary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span className="text-[10px] text-muted-foreground">No token</span>
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {userData?.username || "GHOST Guest"}
            </h2>
            <p className={`text-sm font-mono mt-2 ${userData ? "text-green-400" : "text-muted-foreground"}`}>
              {userData ? "Token Validated  ✅" : "Enter a token below..."}
            </p>
          </div>

          {/* Info Tiles */}
          <div className="mt-8 space-y-2.5 flex-1">
            {[
              { label: "NITRO", value: userData ? getNitroLabel(userData.premium_type || 0) : "—", icon: "💎" },
              { label: "EMAIL", value: userData?.email || "—", icon: "📧" },
              { label: "PHONE", value: userData?.phone || "—", icon: "📱" },
              { label: "USER ID", value: userData?.id || "—", icon: "🆔" },
              { label: "FLAGS", value: userData?.flags != null ? `0x${userData.flags.toString(16)}` : "—", icon: "🏴" },
              { label: "LOCALE", value: userData?.locale || "—", icon: "🌐" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <span className="text-lg shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-mono text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12">
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-5xl lg:text-6xl font-black font-mono tracking-tighter">
              <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                GHOST TOKEN
              </span>
              <br />
              <span className="text-foreground">LOGIN</span>
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-3 tracking-widest">ENCRYPTED TOKEN BYPASS</p>
          </div>

          {/* Token Input */}
          <label className="text-xs font-mono font-bold text-foreground/80 mb-2.5 uppercase tracking-wider block">
            Discord Token
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-40 blur transition-opacity" />
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                placeholder="Paste Discord token here..."
                className="relative w-full h-14 bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl px-5 font-mono text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
            <button
              onClick={() => setShowToken(!showToken)}
              className="w-14 h-14 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl text-xl hover:bg-primary/10 hover:border-primary/30 transition-all flex items-center justify-center"
            >
              {showToken ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-5 h-2 bg-card/50 rounded-full overflow-hidden border border-border/30">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-cyan-400 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: "50%" }}
              />
            </div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm font-mono mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              {error}
            </motion.p>
          )}

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            loading={loading}
            disabled={!token.trim()}
            className="mt-6 h-16 text-lg font-mono font-bold w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 border-0 shadow-lg shadow-primary/20 transition-all"
          >
            VERIFY & LOGIN
          </Button>

          {/* Browser Auto-Login */}
          {userData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <Button
                onClick={() => {
                  const w = window.open("https://discord.com/login", "_blank")
                  if (w) {
                    const script = `
                      function login(token) {
                        setInterval(() => {
                          document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token = '"' + token + '"';
                        }, 50);
                        setTimeout(() => location.reload(), 2500);
                      }
                      login('${token.trim()}');
                    `
                    setTimeout(() => { try { (w as any).eval(script) } catch {} }, 2000)
                  }
                }}
                className="w-full h-12 bg-green-600/80 hover:bg-green-500/80 backdrop-blur-sm border border-green-400/30 font-mono text-sm"
              >
                🚀 Open Discord in Browser (Auto-Login)
              </Button>
              <p className="text-[10px] text-muted-foreground font-mono text-center mt-2">
                Opens Discord in a new tab and injects your token for auto-login
              </p>
            </motion.div>
          )}

          {/* Console Log */}
          <div className="mt-8 bg-black/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-36 font-mono text-xs overflow-y-auto">
            {consoleLines.map((line, i) => (
              <p key={i} className={`${line.includes("ERROR") ? "text-red-400" : line.includes("SUCCESS") ? "text-green-400" : "text-cyan-400/80"}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
