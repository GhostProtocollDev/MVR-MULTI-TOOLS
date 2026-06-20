import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WEBP, GIF" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${uuidv4()}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "backgrounds")

    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(uploadDir, fileName), buffer)

    const url = `/backgrounds/${fileName}`
    const thumbnail = url

    return NextResponse.json({
      id: uuidv4(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      url,
      thumbnail,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[UPLOAD ERROR]", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
