import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transfers = await prisma.fileTransfer.findMany({
      where: { clientId: params.id },
      orderBy: { startedAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error("[FILES_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileName, fileSize, direction } = await req.json()

    const transfer = await prisma.fileTransfer.create({
      data: {
        clientId: params.id,
        fileName: fileName || "unknown",
        fileSize: fileSize || 0,
        direction: direction || "upload",
        status: "pending",
      },
    })

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error("[FILES_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
