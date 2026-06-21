import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = (session.user as any)?.role
    if (role !== "owner" && role !== "administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "24h"

    const now = new Date()
    let since = new Date()
    if (range === "7d") since.setDate(since.getDate() - 7)
    else if (range === "30d") since.setDate(since.getDate() - 30)
    else if (range === "all") since = new Date(2020, 0, 1)
    else since.setHours(since.getHours() - 24)

    const clients = await prisma.remoteClient.findMany({
      select: { id: true, clientId: true, hostname: true, user: true, country: true, countryCode: true, city: true, os: true, ipPublic: true, lastHeartbeat: true, lastSeen: true, lat: true, lng: true, cpu: true, ramUsed: true, ramTotal: true, firstSeen: true, status: true },
    })

    const nowMs = Date.now()
    const enriched = clients.map(c => {
      const hb = c.lastHeartbeat || c.lastSeen
      const diff = hb ? (nowMs - new Date(hb).getTime()) / 1000 : 999999
      return { ...c, state: diff <= 90 ? "online" as const : diff <= 300 ? "idle" as const : "offline" as const }
    })

    const online = enriched.filter(c => c.state === "online").length
    const offline = enriched.filter(c => c.state !== "online").length

    // Top countries with online count
    const countryMap: Record<string, { total: number; online: number; code: string | null }> = {}
    enriched.forEach(c => {
      const n = c.country || "Unknown"
      if (!countryMap[n]) countryMap[n] = { total: 0, online: 0, code: c.countryCode }
      countryMap[n].total++
      if (c.state === "online") countryMap[n].online++
    })
    const topCountries = Object.entries(countryMap)
      .map(([name, data]) => ({ name, ...data, pct: Math.round((data.total / clients.length) * 100) || 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Connection history (simulated from sessions)
    const sessions = await prisma.clientSession.findMany({
      where: { connectedAt: { gte: since } },
      orderBy: { connectedAt: "asc" },
      select: { connectedAt: true, status: true },
    })

    // Generate chart points
    const intervalMin = range === "24h" ? 60 : range === "7d" ? 360 : 1440
    const points: { time: string; online: number; total: number; ts: number }[] = []
    
    for (let t = since.getTime(); t <= now.getTime(); t += intervalMin * 60000) {
      const cutoff = t
      const d = new Date(cutoff)
      const key = range === "24h" ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) :
                  d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit" })
      
      const connectedAt = enriched.filter(c => {
        const hb = c.lastHeartbeat || c.lastSeen
        return hb && new Date(hb).getTime() >= cutoff && new Date(hb).getTime() < cutoff + intervalMin * 60000
      }).length

      points.push({ time: key, online: connectedAt || 0, total: clients.length, ts: cutoff })
    }

    // Limit points for performance
    const limited = points.length > 50 ? points.filter((_, i) => i % Math.ceil(points.length / 50) === 0 || i === points.length - 1) : points

    return NextResponse.json({
      stats: { total: clients.length, online, offline, lastUpdate: now.toISOString() },
      topCountries,
      chart: limited,
      clients: enriched,
    })
  } catch (error) {
    console.error("[STATS]", error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
