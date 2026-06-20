import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const track = await prisma.track.findUnique({ where: { id: params.id } })
    if (!track || !track.filePath) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const filePath = join(process.cwd(), "public", track.filePath)
    const buffer = await readFile(filePath)
    const ext = track.filePath.split(".").pop() || "mp3"
    const fileName = `${track.artistId}-${track.title.replace(/\s+/g, "_")}.${ext}`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": track.mimeType || "audio/mpeg",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("[MUSIC_DOWNLOAD]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
