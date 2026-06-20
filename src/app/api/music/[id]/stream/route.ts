import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const track = await prisma.track.findUnique({ where: { id: params.id } })
    if (!track || !track.filePath) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    await prisma.track.update({
      where: { id: params.id },
      data: { plays: { increment: 1 } },
    })

    const filePath = join(process.cwd(), "public", track.filePath)
    const buffer = await readFile(filePath)

    const range = req.headers.get("range")
    const mime = track.mimeType || "audio/mpeg"
    const size = buffer.length

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1
      const chunk = buffer.subarray(start, end + 1)

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": `${chunk.length}`,
          "Content-Type": mime,
        },
      })
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Length": `${size}`,
        "Content-Type": mime,
        "Accept-Ranges": "bytes",
      },
    })
  } catch (error) {
    console.error("[MUSIC_STREAM]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
