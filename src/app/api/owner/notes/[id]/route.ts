import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireOwnerOrAdmin(session: any): NextResponse | null {
  const role = (session?.user as any)?.role
  if (role !== "owner" && role !== "administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const { id } = params

    const note = await prisma.internalNote.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, image: true } },
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const history = await prisma.activityLog.findMany({
      where: {
        action: "NOTE_EDITED",
        details: { contains: id },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ note, history })
  } catch (error) {
    console.error("[OWNER_NOTE_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const { id } = params
    const body = await req.json()
    const { content, isPinned } = body

    const existing = await prisma.internalNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const data: any = {}
    if (content !== undefined) {
      data.content = content
      data.editedAt = new Date()
    }
    if (isPinned !== undefined) {
      data.isPinned = isPinned
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const note = await prisma.internalNote.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, username: true, image: true } },
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("[OWNER_NOTE_PATCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const { id } = params

    const existing = await prisma.internalNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.internalNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[OWNER_NOTE_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
