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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")

    const where: any = {}
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId

    const notes = await prisma.internalNote.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, image: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("[OWNER_NOTES_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const body = await req.json()
    const { content, targetType, targetId } = body

    if (!content || !targetType || !targetId) {
      return NextResponse.json({ error: "content, targetType, and targetId are required" }, { status: 400 })
    }

    const note = await prisma.internalNote.create({
      data: {
        content,
        targetType,
        targetId,
        authorId: (session?.user as any)?.id,
      },
      include: {
        author: { select: { id: true, username: true, image: true } },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("[OWNER_NOTES_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const body = await req.json()
    const { noteId, content, isPinned } = body

    if (!noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 })
    }

    const existing = await prisma.internalNote.findUnique({ where: { id: noteId } })
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
      where: { id: noteId },
      data,
      include: {
        author: { select: { id: true, username: true, image: true } },
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("[OWNER_NOTES_PATCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const forbidden = requireOwnerOrAdmin(session)
    if (forbidden) return forbidden

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get("noteId")

    if (!noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 })
    }

    const existing = await prisma.internalNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.internalNote.delete({ where: { id: noteId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[OWNER_NOTES_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
