import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const artistId = searchParams.get("artistId") || ""
    const albumId = searchParams.get("albumId") || ""

    const where: any = {}
    if (artistId) where.artistId = artistId
    if (albumId) where.albumId = albumId

    const [artists, albums, tracks] = await Promise.all([
      prisma.artist.findMany({
        where: search ? { name: { contains: search } } : {},
        include: { _count: { select: { albums: true, tracks: true } } },
        orderBy: { name: "asc" },
      }),
      artistId ? prisma.album.findMany({
        where: { artistId, ...(search ? { title: { contains: search } } : {}) },
        include: { artist: true, _count: { select: { tracks: true } } },
        orderBy: { year: "desc" },
      }) : Promise.resolve([]),
      albumId ? prisma.track.findMany({
        where: {
          albumId,
          ...(search ? { title: { contains: search } } : {}),
        },
        include: { artist: true, album: true },
        orderBy: { trackNumber: "asc" },
      }) : Promise.resolve([]),
    ])

    const allTracks = !artistId && !albumId && search
      ? await prisma.track.findMany({
          where: {
            OR: [
              { title: { contains: search } },
              { artist: { name: { contains: search } } },
              { album: { title: { contains: search } } },
            ],
          },
          include: { artist: true, album: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : []

    return NextResponse.json({ artists, albums, tracks, searchResults: allTracks })
  } catch (error) {
    console.error("[MUSIC_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string | null
    const artistId = formData.get("artistId") as string | null
    const albumId = formData.get("albumId") as string | null
    const trackNumber = parseInt(formData.get("trackNumber") as string || "1")

    if (!file || !title || !artistId || !albumId) {
      return NextResponse.json({ error: "file, title, artistId, and albumId are required" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB" }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3"
    const fileName = `${uuidv4()}.${ext}`
    const musicDir = join(process.cwd(), "public", "uploads", "music")
    await mkdir(musicDir, { recursive: true })
    await writeFile(join(musicDir, fileName), buf)

    const track = await prisma.track.create({
      data: {
        title,
        artistId,
        albumId,
        trackNumber,
        filePath: `/uploads/music/${fileName}`,
        fileSize: file.size,
        mimeType: file.type || "audio/mpeg",
      },
      include: { artist: true, album: true },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error("[MUSIC_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    await prisma.track.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MUSIC_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
