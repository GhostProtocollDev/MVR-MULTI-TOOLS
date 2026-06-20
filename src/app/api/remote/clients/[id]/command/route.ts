import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { command } = await req.json()
    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    const client = await prisma.remoteClient.findUnique({ where: { id: params.id } })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const log = await prisma.commandLog.create({
      data: {
        clientId: params.id,
        command,
        status: "pending",
        executedBy: (session.user as any).username || "dashboard",
      },
    })

    return NextResponse.json({ command: log, message: "Command queued for execution." })
  } catch (error) {
    console.error("[COMMAND_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
