import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

// PUT: Called by C# client (no auth needed, uses clientId UUID)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientIdUuid = params.id
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ clientId: clientIdUuid }, { id: clientIdUuid }] },
    })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    const buf = Buffer.from(await req.arrayBuffer())
    if (buf.length === 0) return NextResponse.json({ error: "Empty body" }, { status: 400 })
    // FIX: Size limit (10MB for screenshots)
    if (buf.length > 10 * 1024 * 1024) return NextResponse.json({ error: "Too large" }, { status: 413 })

    const dir = path.join(process.cwd(), "public", "screenshots")
    fs.mkdirSync(dir, { recursive: true })

    const filename = `screenshot_${client.id}_${Date.now()}.png`
    fs.writeFileSync(path.join(dir, filename), buf)

    await prisma.screenCapture.create({
      data: {
        clientId: client.id,
        imagePath: `/screenshots/${filename}`,
        size: buf.length,
      },
    })

    await prisma.remoteClient.update({
      where: { id: client.id },
      data: { lastSeen: new Date() },
    })

    return NextResponse.json({ success: true, path: `/screenshots/${filename}` })
  } catch (error) {
    console.error("[SCREENSHOT_PUT]", error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

// POST: Called by dashboard — requires owner/admin auth
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = (session.user as any)?.role
    if (role !== "owner" && role !== "administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
    })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({
      success: true,
      message: "Send !screenshot command to the client to capture screen",
      screenshots: await prisma.screenCapture.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    })
  } catch (error) {
    console.error("[SCREENSHOT_POST]", error)
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}

// GET: Called by dashboard — requires owner/admin auth
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = (session.user as any)?.role
    if (role !== "owner" && role !== "administrator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
    })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const screenshots = await prisma.screenCapture.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ screenshots })
  } catch {
    return NextResponse.json({ error: "Internal" }, { status: 500 })
  }
}
