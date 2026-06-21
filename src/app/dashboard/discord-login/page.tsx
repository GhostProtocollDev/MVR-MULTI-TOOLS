'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"

export default function DiscordLoginPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState("")
  const [showToken, setShowToken] = useState(false)

  async function handleVerify() {
    if (!token.trim()) return
    setLoading(true)
    setError("")
    setUserData(null)
    try {
      const res = await fetch("https://discord.com/api/v9/users/@me", {
        headers: { Authorization: token.trim() },
      })
      if (res.status === 401) { setError("Invalid or expired token"); return }
      if (!res.ok) { setError(`Discord API error: ${res.status}`); return }
      const data = await res.json()
      setUserData(data)
    } catch {
      setError("Network error. Check your connection.")
    } finally { setLoading(false) }
  }

  function getNitroLabel(type: number): string {
    if (type === 2) return "Nitro (Tier 2)"
    if (type === 1) return "Nitro Classic"
    return "None"
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <div className="w-[350px] bg-[#111116] border-r border-[#A855F7]/30 flex flex-col p-6">
        <div className="flex flex-col items-center">
          <div className="w-[150px] h-[150px] rounded-full border-2 border-[#A855F7] bg-[#1A1A2A] flex items-center justify-center mb-4 overflow-hidden">
            {userData?.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">🖧</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#E0E0E0] font-mono">{userData?.username || "GHOST Guest"}</h2>
          <p className="text-sm text-[#A855F7] font-mono mt-1">{userData ? "Token Validated ✅" : "Enter a token..."}</p>
        </div>

        <div className="mt-8 space-y-3">
          {[
            { label: "NITRO", value: userData ? getNitroLabel(userData.premium_type || 0) : "N/A" },
            { label: "EMAIL", value: userData?.email || "N/A" },
            { label: "PHONE", value: userData?.phone || "N/A" },
            { label: "USER ID", value: userData?.id || "N/A" },
            { label: "FLAGS", value: userData?.flags ? `0x${userData.flags.toString(16)}` : "N/A" },
            { label: "LOCALE", value: userData?.locale || "N/A" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0A0A0F] border border-[#A855F7]/20 rounded-lg p-3">
              <p className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">{label}</p>
              <p className="text-sm text-[#5EEAD4] font-mono truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-16">
        <h1 className="text-5xl font-bold text-[#A855F7] font-mono tracking-wider">GHOST TOKEN LOGIN</h1>
        <p className="text-sm text-[#9CA3AF] font-mono mt-2 mb-12">ENCRYPTED TOKEN BYPASS</p>

        {/* Input */}
        <label className="text-sm font-mono font-bold text-[#E0E0E0] mb-2">TOKEN DISCORD</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="Paste Discord token..."
              className="w-full h-14 bg-[#0A0A0F] border-2 border-[#A855F7] rounded-xl px-4 font-mono text-base text-[#5EEAD4] placeholder-zinc-600 focus:outline-none focus:border-[#A855F7] focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
            />
          </div>
          <button
            onClick={() => setShowToken(!showToken)}
            className="w-14 h-14 bg-[#111116] border border-[#A855F7] rounded-xl text-xl hover:bg-[#A855F7]/10 transition-colors flex items-center justify-center"
          >
            {showToken ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Progress */}
        {loading && (
          <div className="mt-4 h-2 bg-[#111116] rounded-full overflow-hidden border border-[#A855F7]/30">
            <motion.div
              className="h-full bg-gradient-to-r from-[#A855F7] to-[#5EEAD4]"
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm font-mono mt-3">{error}</p>}

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          loading={loading}
          disabled={!token.trim()}
          className="mt-6 h-16 text-lg font-mono font-bold w-full bg-[#A855F7] hover:bg-[#9333EA] border-2 border-[#A855F7]"
        >
          VERIFY &amp; LOGIN
        </Button>

        {/* Browser Login */}
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
              className="w-full h-12 bg-green-600 hover:bg-green-500 border border-green-400 font-mono text-sm"
            >
              🚀 Open Discord in Browser (Auto-Login)
            </Button>
            <p className="text-[10px] text-zinc-600 font-mono text-center mt-2">
              Opens Discord in a new tab and injects your token for auto-login
            </p>
          </motion.div>
        )}

        {/* Console Log */}
        <div className="mt-8 bg-[#050505] border border-[#A855F7]/20 rounded-xl p-4 h-32 font-mono text-xs text-[#5EEAD4] overflow-y-auto">
          <p>[{new Date().toLocaleTimeString()}] GHOST TOKEN LOGIN engine initialized...</p>
          {token && <p>[{new Date().toLocaleTimeString()}] Token received ({token.length} chars)</p>}
          {loading && <p>[{new Date().toLocaleTimeString()}] Validating with Discord API...</p>}
          {userData && <p>[{new Date().toLocaleTimeString()}] SUCCESS: {userData.username}#{userData.discriminator || '0'} authenticated</p>}
          {error && <p className="text-red-400">[{new Date().toLocaleTimeString()}] ERROR: {error}</p>}
        </div>
      </div>
    </motion.div>
  )
}
