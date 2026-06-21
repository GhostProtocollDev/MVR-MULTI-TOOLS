import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

// POST: C# client uploads a live JPEG frame
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ clientId: params.id }, { id: params.id }] },
    })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const buf = Buffer.from(await req.arrayBuffer())
    if (buf.length < 100) return NextResponse.json({ error: "Empty" }, { status: 400 })

    const dir = path.join(process.cwd(), "public", "live")
    fs.mkdirSync(dir, { recursive: true })

    const filePath = path.join(dir, `live_${client.id}.jpg`)
    fs.writeFileSync(filePath, buf)

    await prisma.remoteClient.update({
      where: { id: client.id },
      data: { lastSeen: new Date(), status: "online" },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[LIVE_FRAME_POST]", error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

// GET: Frontend requests latest frame as JPEG image
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ clientId: params.id }, { id: params.id }] },
    })
    if (!client) return new NextResponse("Not found", { status: 404 })

    const filePath = path.join(process.cwd(), "public", "live", `live_${client.id}.jpg`)
    if (!fs.existsSync(filePath)) {
      return new NextResponse("No frame yet", { status: 404 })
    }

    const buf = fs.readFileSync(filePath)
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch {
    return new NextResponse("Error", { status: 500 })
  }
}
