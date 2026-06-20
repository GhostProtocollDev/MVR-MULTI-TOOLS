import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get("name")

    if (!fileName) {
      // List available files
      const clientDir = path.join(process.cwd(), "uploads", "remote", client.id)
      if (!fs.existsSync(clientDir)) {
        return NextResponse.json({ files: [] })
      }
      const files = fs.readdirSync(clientDir).map((f) => {
        const stat = fs.statSync(path.join(clientDir, f))
        return { name: f, size: stat.size, modified: stat.mtime }
      })
      return NextResponse.json({ files })
    }

    const filePath = path.join(process.cwd(), "uploads", "remote", client.id, fileName)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    })
  } catch (error) {
    console.error("[FILE_DOWNLOAD]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await prisma.remoteClient.findFirst({
      where: { OR: [{ id: params.id }, { clientId: params.id }] },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const body = await req.json()
    const { fileName, localPath } = body

    if (!fileName) {
      return NextResponse.json({ error: "fileName required" }, { status: 400 })
    }

    const transfer = await prisma.fileTransfer.create({
      data: {
        clientId: client.id,
        direction: "download",
        fileName,
        status: "pending",
      },
    })

    return NextResponse.json({
      transfer,
      message: "Download queued. The client will process when online.",
    })
  } catch (error) {
    console.error("[FILE_DOWNLOAD_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
