"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"

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
      addLog("Validating cookie with Roblox API...")
      const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      const cookies = { ".ROBLOSECURITY": cookie.trim() }

      const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", { headers, credentials: "omit" })
      if (authRes.status !== 200) {
        setError("Invalid or expired cookie (IP locked or bad cookie)")
        addLog("ERROR: Cookie validation failed")
        setLoading(false)
        return
      }

      const auth = await authRes.json()
      const uid = auth.id
      const username = auth.name

      // Fetch all data in parallel
      addLog(`Authenticated as ${username} (ID: ${uid})`)

      const [
        robuxRes, premRes, avatarRes, userRes, friendsRes,
        followersRes, followingsRes, emailRes, phoneRes, twoFaRes,
        pinRes, countryRes, groupsRes, badgesRes, wearingRes, gamesRes
      ] = await Promise.allSettled([
        fetch(`https://economy.roblox.com/v1/users/${uid}/currency`, { headers, credentials: "omit" }),
        fetch(`https://premiumfeatures.roblox.com/v1/users/${uid}/validate-membership`, { headers, credentials: "omit" }),
        fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${uid}&size=150x150&format=Png`, { headers }),
        fetch(`https://users.roblox.com/v1/users/${uid}`, { headers }),
        fetch(`https://friends.roblox.com/v1/users/${uid}/friends/count`, { headers }),
        fetch(`https://friends.roblox.com/v1/users/${uid}/followers/count`, { headers }),
        fetch(`https://friends.roblox.com/v1/users/${uid}/followings/count`, { headers }),
        fetch("https://accountsettings.roblox.com/v1/email", { headers, credentials: "omit" }),
        fetch("https://accountsettings.roblox.com/v1/phone", { headers, credentials: "omit" }),
        fetch(`https://twostepverification.roblox.com/v1/users/${uid}/configuration`, { headers, credentials: "omit" }),
        fetch("https://auth.roblox.com/v1/account/pin", { headers, credentials: "omit" }),
        fetch("https://users.roblox.com/v1/users/authenticated/country-code", { headers, credentials: "omit" }),
        fetch(`https://groups.roblox.com/v1/users/${uid}/groups/roles`, { headers }),
        fetch(`https://accountinformation.roblox.com/v1/users/${uid}/roblox-badges`, { headers }),
        fetch(`https://avatar.roblox.com/v1/users/${uid}/currently-wearing`, { headers }),
        fetch(`https://games.roblox.com/v2/users/${uid}/games?accessFilter=Public&limit=50`, { headers }),
      ])

      const data: any = { username, uid, displayName: auth.displayName }

      const get = (r: PromiseSettledResult<Response>) =>
        r.status === "fulfilled" && r.value.ok ? r.value.json().catch(() => ({})) : Promise.resolve({})

      const [robux, prem, avatar, user, friends, followers, followings, email, phone, twoFa, pin, country, groups, badges, wearing, games] =
        await Promise.all([get(robuxRes), get(premRes), get(avatarRes), get(userRes), get(friendsRes), get(followersRes), get(followingsRes), get(emailRes), get(phoneRes), get(twoFaRes), get(pinRes), get(countryRes), get(groupsRes), get(badgesRes), get(wearingRes), get(gamesRes)])

      data.robux = robux.robux || 0
      data.premium = prem === true || (prem?.premiumFeatureId !== undefined)
      data.avatarUrl = avatar.data?.[0]?.imageUrl || null
      data.created = user.created?.split("T")[0] || null
      data.about = (user.description || "").substring(0, 50) || null
      data.friends = friends.count || 0
      data.followers = followers.count || 0
      data.followings = followings.count || 0
      data.email = email.emailAddress || null
      data.emailVerified = email.verified || false
      data.phone = phone.phone || null
      data.phoneVerified = phone.isVerified || false
      data.twoFa = twoFa.is2faEnabled || false
      data.pin = pin.isEnabled || false
      data.country = country.countryCode || null
      data.groups = groups.data?.length || 0
      data.groupsOwned = groups.data?.filter((g: any) => g.role?.rank === 255).length || 0
      data.badges = Array.isArray(badges) ? badges.length : 0
      data.wearing = wearing.assetIds?.length || 0
      data.games = games.data?.length || 0
      data.verified = user.hasVerifiedBadge || false

      // Calculate account age
      if (data.created) {
        const diff = Date.now() - new Date(data.created).getTime()
        data.ageDays = Math.floor(diff / 86400000)
      }

      setUserData(data)
      addLog(`SUCCESS: ${username} | Robux: ${data.robux} | Friends: ${data.friends}`)
    } catch {
      setError("Network error. Check your connection.")
      addLog("ERROR: Network failure")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-orange-500/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-yellow-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-4rem)]">
        {/* Left Panel - User Info Card */}
        <div className="lg:w-[380px] bg-card/40 backdrop-blur-xl border-r border-border/50 flex flex-col p-8">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl scale-150 animate-pulse" />
              <div className="w-44 h-44 rounded-full border-[3px] border-red-500/60 bg-card/80 flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                {userData?.avatarUrl ? (
                  <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-16 h-16 text-red-500/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    <span className="text-[10px] text-muted-foreground">No cookie</span>
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              {userData?.username || "ROBLOX Guest"}
            </h2>
            <p className={`text-sm font-mono mt-2 ${userData ? "text-green-400" : "text-muted-foreground"}`}>
              {userData ? "Cookie Validated ✅" : "Enter .ROBLOSECURITY cookie..."}
            </p>
          </div>

          {/* Info Tiles */}
          <div className="mt-8 space-y-2.5 flex-1 overflow-y-auto">
            {[
              { label: "DISPLAY NAME", value: userData?.displayName || "—", icon: "📛" },
              { label: "USER ID", value: userData?.uid || "—", icon: "🆔" },
              { label: "ROBUX", value: userData ? `R$ ${userData.robux?.toLocaleString() || 0}` : "—", icon: "💰" },
              { label: "PREMIUM", value: userData ? (userData.premium ? "✅ Yes" : "❌ No") : "—", icon: "⭐" },
              { label: "EMAIL", value: userData?.email ? `${userData.email} ${userData.emailVerified ? "✅" : ""}` : "—", icon: "📧" },
              { label: "PHONE", value: userData?.phone ? `${userData.phone} ${userData.phoneVerified ? "✅" : ""}` : "—", icon: "📱" },
              { label: "2FA", value: userData ? (userData.twoFa ? "🔒 Enabled" : "🔓 Disabled") : "—", icon: "🔐" },
              { label: "PIN", value: userData ? (userData.pin ? "🔒 Enabled" : "🔓 Disabled") : "—", icon: "🔢" },
              { label: "COUNTRY", value: userData?.country || "—", icon: "🌍" },
              { label: "CREATED", value: userData?.created || "—", icon: "📅" },
              { label: "AGE", value: userData?.ageDays ? `${userData.ageDays} days` : "—", icon: "🎂" },
              { label: "VERIFIED", value: userData ? (userData.verified ? "✅ Yes" : "❌ No") : "—", icon: "✔️" },
              { label: "FRIENDS", value: userData?.friends?.toLocaleString() || "—", icon: "👥" },
              { label: "FOLLOWERS", value: userData?.followers?.toLocaleString() || "—", icon: "👁️" },
              { label: "FOLLOWINGS", value: userData?.followings?.toLocaleString() || "—", icon: "🔍" },
              { label: "GROUPS", value: userData ? `${userData.groups || 0} (${userData.groupsOwned || 0} owned)` : "—", icon: "🏘️" },
              { label: "BADGES", value: userData?.badges?.toString() || "—", icon: "🏅" },
              { label: "WEARING", value: userData ? `${userData.wearing || 0} items` : "—", icon: "👕" },
              { label: "GAMES", value: userData ? `${userData.games || 0} public` : "—", icon: "🎮" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3.5 flex items-center gap-3 hover:border-red-500/30 transition-colors">
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
          <div className="mb-12">
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
          <div className="flex gap-3">
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

          {/* Cookie format hint */}
          <p className="text-[10px] text-muted-foreground font-mono mt-2">
            Format: _|WARNING:-DO-NOT-SHARE-THIS...
          </p>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-5 h-2 bg-card/50 rounded-full overflow-hidden border border-border/30">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 rounded-full"
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
            disabled={!cookie.trim()}
            className="mt-6 h-16 text-lg font-mono font-bold w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 border-0 shadow-lg shadow-red-500/20 transition-all"
          >
            VERIFY &amp; LOGIN
          </Button>

          {/* Browser Auto-Login */}
          {userData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <Button
                onClick={() => {
                  const w = window.open("https://www.roblox.com/Login", "_blank")
                  if (w) {
                    const ck = cookie.trim()
                    const script = `
                      document.cookie = ".ROBLOSECURITY=" + "${ck}" + "; domain=.roblox.com; path=/";
                      setTimeout(() => location.href = "https://www.roblox.com/home", 1500);
                    `
                    setTimeout(() => { try { (w as any).eval(script) } catch {} }, 2000)
                  }
                }}
                className="w-full h-12 bg-red-600/80 hover:bg-red-500/80 backdrop-blur-sm border border-red-400/30 font-mono text-sm"
              >
                🎮 Open Roblox in Browser (Auto-Login)
              </Button>
              <p className="text-[10px] text-muted-foreground font-mono text-center mt-2">
                Opens Roblox and injects your cookie for auto-login
              </p>
            </motion.div>
          )}

          {/* Console Log */}
          <div className="mt-8 bg-black/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-36 font-mono text-xs overflow-y-auto">
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
