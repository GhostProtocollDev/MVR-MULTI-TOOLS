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
    const fileName = searchParams.get("name") || `file_${Date.now()}`
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

    const clientDir = path.join(process.cwd(), "uploads", "remote", client.id)
    fs.mkdirSync(clientDir, { recursive: true })
    const filePath = path.join(clientDir, fileName)
    fs.writeFileSync(filePath, fileBuffer)

    const transfer = await prisma.fileTransfer.create({
      data: {
        clientId: client.id,
        direction: "upload",
        fileName,
        fileSize,
        filePath,
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
