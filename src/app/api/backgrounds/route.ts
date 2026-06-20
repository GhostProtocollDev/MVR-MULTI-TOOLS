import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readdir, stat, unlink } from "fs/promises"
import path from "path"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const backgroundsDir = path.join(process.cwd(), "public", "backgrounds")
    let files: string[] = []
    try {
      files = await readdir(backgroundsDir)
    } catch {
      return NextResponse.json([])
    }

    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    const backgrounds = await Promise.all(
      files
        .filter((f) => allowedExt.includes(path.extname(f).toLowerCase()))
        .map(async (f) => {
          const filePath = path.join(backgroundsDir, f)
          const stats = await stat(filePath)
          return {
            id: f,
            name: path.parse(f).name,
            url: `/backgrounds/${f}`,
            thumbnail: `/backgrounds/${f}`,
            isFavorite: false,
            isActive: false,
            createdAt: stats.birthtime.toISOString(),
            fileSize: stats.size,
            width: 0,
            height: 0,
          }
        })
    )

    return NextResponse.json(backgrounds)
  } catch (error) {
    console.error("[BACKGROUNDS LIST ERROR]", error)
    return NextResponse.json({ error: "Failed to list backgrounds" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filename } = await req.json()
    if (!filename) {
      return NextResponse.json({ error: "No filename provided" }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), "public", "backgrounds", filename)
    await unlink(filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BACKGROUND DELETE ERROR]", error)
    return NextResponse.json({ error: "Failed to delete background" }, { status: 500 })
  }
}
