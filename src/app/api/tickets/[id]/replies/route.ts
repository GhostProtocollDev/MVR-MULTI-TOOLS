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

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    if (!isStaff && ticket.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const replies = await prisma.ticketReply.findMany({
      where: { ticketId: params.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error("[REPLIES_GET]", error)
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const role = (session.user as any).role
    const isStaff = role === "admin" || role === "owner"

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    if (!isStaff && ticket.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 })

    const reply = await prisma.ticketReply.create({
      data: { ticketId: params.id, userId, message, isStaff },
      include: { user: true },
    })

    await logActivity(userId, "ticket_reply", `Replied to ticket ${params.id}`)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("[REPLIES_POST]", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
