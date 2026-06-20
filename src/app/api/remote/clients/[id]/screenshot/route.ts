import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const cmd = await prisma.commandLog.create({
      data: {
        clientId: client.id,
        command: "SCREENSHOT",
        status: "pending",
        executedBy: (session.user as any).username || "dashboard",
      },
    })

    return NextResponse.json({ commandId: cmd.id, message: "Screenshot requested" })
  } catch (error) {
    console.error("[SCREENSHOT_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
      select: { id: true, hostname: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const contentType = req.headers.get("content-type") || ""
    let imageBuffer: Buffer
    let width = 0
    let height = 0

    if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      const formData = await req.formData()
      const image = formData.get("image") as File
      if (!image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 })
      }
      imageBuffer = Buffer.from(await image.arrayBuffer())
      width = parseInt(formData.get("width") as string) || 0
      height = parseInt(formData.get("height") as string) || 0
    } else {
      imageBuffer = Buffer.from(await req.arrayBuffer())
    }

    const filename = `screenshot_${client.id}_${Date.now()}.png`
    const dir = path.join(process.cwd(), "public", "screenshots")
    fs.mkdirSync(dir, { recursive: true })
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, imageBuffer)

    await prisma.screenCapture.create({
      data: {
        clientId: client.id,
        imagePath: `/screenshots/${filename}`,
        width, height, size: imageBuffer.length,
        format: "png",
      },
    })

    await prisma.remoteClient.update({
      where: { id: client.id },
      data: { lastSeen: new Date() },
    })

    return NextResponse.json({ success: true, path: `/screenshots/${filename}` })
  } catch (error) {
    console.error("[SCREENSHOT_PUT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
