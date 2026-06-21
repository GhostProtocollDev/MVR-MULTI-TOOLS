import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await prisma.remoteClient.findUnique({
      where: { id: params.id },
      include: {
        builder: { select: { id: true, name: true, uuid: true } },
        sessions: { orderBy: { connectedAt: "desc" }, take: 20 },
        commands: { orderBy: { executedAt: "desc" }, take: 50 },
        fileTransfers: { orderBy: { startedAt: "desc" }, take: 20 },
        screenCaptures: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("[CLIENT_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.remoteClient.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CLIENT_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
