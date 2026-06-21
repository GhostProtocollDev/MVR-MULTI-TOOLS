import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
      select: { id: true, hostname: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const rawName = searchParams.get("name") || `file_${Date.now()}`
    // FIX: Path traversal protection
    const safeName = rawName.replace(/[\/\\]/g, "").replace(/\.\./g, "")
    const formData = await req.formData()
    const file = formData.get("file") as File

    let fileBuffer: Buffer
    let fileSize: number

    if (file) {
      fileBuffer = Buffer.from(await file.arrayBuffer())
      fileSize = fileBuffer.length
    } else {
      const rawBuffer = await req.arrayBuffer()
      fileBuffer = Buffer.from(rawBuffer)
      fileSize = fileBuffer.length
    }

    // FIX: Size limit (50MB)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
    }

    const clientDir = path.resolve(process.cwd(), "uploads", "remote", client.id)
    fs.mkdirSync(clientDir, { recursive: true })
    const filePath = path.resolve(clientDir, safeName)
    // FIX: Containment check
    if (!filePath.startsWith(clientDir + path.sep)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }
    fs.writeFileSync(filePath, fileBuffer)

    const transfer = await prisma.fileTransfer.create({
      data: {
        clientId: client.id,
        direction: "upload",
        fileName: safeName,
        fileSize,
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error("[FILE_UPLOAD]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
