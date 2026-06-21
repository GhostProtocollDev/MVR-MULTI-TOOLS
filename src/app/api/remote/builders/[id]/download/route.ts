import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const builder = await prisma.builder.findUnique({ where: { id: params.id } })
    if (!builder) {
      return NextResponse.json({ error: "Builder not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const rawName = searchParams.get("file") || "GhostClient.exe"
    // FIX: Path traversal protection — strip directory separators and ..
    const safeName = rawName.replace(/[\/\\]/g, "").replace(/\.\./g, "")
    const builderDir = path.resolve(process.cwd(), "builds", builder.uuid)
    const filePath = path.resolve(builderDir, safeName)
    // Containment check — resolved path must be inside builder dir
    if (!filePath.startsWith(builderDir + path.sep)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    })
  } catch (error) {
    console.error("[DOWNLOAD_EXE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
