import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id
    const isStaff = (session.user as any).role === "admin" || (session.user as any).role === "owner"

    const where = isStaff ? {} : { userId }

    const tickets = await prisma.ticket.findMany({
      where,
      include: { user: true, replies: { include: { user: true } } },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { subject, message, category, priority } = body
    const userId = (session.user as any).id

    const ticket = await prisma.ticket.create({
      data: { userId, subject, message, category, priority },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
