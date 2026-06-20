import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner" && (session?.user as any)?.role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clients = await prisma.remoteClient.findMany({
      include: {
        builder: { select: { id: true, name: true } },
        _count: { select: { sessions: true, commands: true } },
      },
      orderBy: { lastSeen: "desc" },
    })

    const stats = {
      total: clients.length,
      online: clients.filter((c) => c.status === "online").length,
      offline: clients.filter((c) => c.status === "offline").length,
      verified: clients.filter((c) => c.isVerified).length,
    }

    return NextResponse.json({ clients, stats })
  } catch (error) {
    console.error("[CLIENTS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
