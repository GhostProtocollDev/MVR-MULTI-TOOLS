import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const isStaff = (session.user as any).role === "admin" || (session.user as any).role === "owner"

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        replies: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
    })

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    if (!isStaff && ticket.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("[TICKET_GET]", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const isStaff = (session.user as any).role === "admin" || (session.user as any).role === "owner"

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    if (!isStaff && ticket.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { status, assignedTo } = body

    const data: Record<string, string> = {}

    if (status) {
      const validStatuses = ["open", "in_progress", "closed"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      data.status = status
    }

    if (assignedTo !== undefined) {
      if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      data.assignedTo = assignedTo
    }

    const updated = await prisma.ticket.update({
      where: { id: params.id },
      data,
      include: { user: true, replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
    })

    await logActivity(userId, "ticket_update", `Updated ticket ${params.id}: ${JSON.stringify(data)}`)

    return NextResponse.json({ ticket: updated })
  } catch (error) {
    console.error("[TICKET_PATCH]", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = (session.user as any).role
    if (role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.ticket.delete({ where: { id: params.id } })

    await logActivity((session.user as any).id, "ticket_delete", `Deleted ticket ${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TICKET_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 })
  }
}
