import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    // Find client by clientId (the external unique ID)
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const pendingCommands = await prisma.commandLog.findMany({
      where: { clientId: client.id, status: "pending" },
      orderBy: { executedAt: "asc" },
      take: 10,
    })

    return NextResponse.json({ commands: pendingCommands })
  } catch (error) {
    console.error("[CLIENT_COMMANDS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const body = await req.json()
    const { commandId, output, status } = body

    if (!commandId) {
      return NextResponse.json({ error: "commandId required" }, { status: 400 })
    }

    await prisma.commandLog.update({
      where: { id: commandId },
      data: {
        output: output || null,
        status: status || "completed",
        completedAt: status === "completed" ? new Date() : undefined,
      },
    })

    await prisma.remoteClient.update({
      where: { id: client.id },
      data: { lastSeen: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CLIENT_COMMANDS_PUT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
