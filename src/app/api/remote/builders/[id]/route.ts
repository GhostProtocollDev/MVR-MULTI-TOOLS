import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const builder = await prisma.builder.findUnique({
      where: { id: params.id },
      include: {
        clients: {
          orderBy: { lastSeen: "desc" },
          take: 100,
        },
        _count: { select: { clients: true } },
      },
    })

    if (!builder) {
      return NextResponse.json({ error: "Builder not found" }, { status: 404 })
    }

    return NextResponse.json({ builder })
  } catch (error) {
    console.error("[BUILDER_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const builder = await prisma.builder.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        allowedDomains: body.allowedDomains,
      },
    })

    return NextResponse.json({ builder })
  } catch (error) {
    console.error("[BUILDER_PUT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.builder.deleteMany({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BUILDER_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
