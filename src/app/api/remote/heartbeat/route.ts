import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientId, cpu, ramUsed, ramTotal, status, hostname, ipPublic, ipLocal } = body

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 })
    }

    const client = await prisma.remoteClient.findUnique({ where: { clientId } })
    if (!client) {
      return NextResponse.json({ error: "Client not registered" }, { status: 404 })
    }

    const updateData: any = {
      status: "online",
      lastSeen: new Date(),
      lastHeartbeat: new Date(),
    }
    if (cpu !== undefined) updateData.cpu = cpu
    if (ramUsed !== undefined) updateData.ramUsed = ramUsed
    if (ramTotal !== undefined) updateData.ramTotal = ramTotal
    if (hostname) updateData.hostname = hostname
    if (ipPublic) updateData.ipPublic = ipPublic
    if (ipLocal) updateData.ipLocal = ipLocal

    await prisma.remoteClient.update({
      where: { clientId },
      data: updateData,
    })

    const pendingCommands = await prisma.commandLog.findMany({
      where: { clientId: client.id, status: "pending" },
      orderBy: { executedAt: "asc" },
    })

    return NextResponse.json({
      success: true,
      pendingCommands: pendingCommands.map((c) => ({ id: c.id, command: c.command })),
    })
  } catch (error) {
    console.error("[HEARTBEAT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
