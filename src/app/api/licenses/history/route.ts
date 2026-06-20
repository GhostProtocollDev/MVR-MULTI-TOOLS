import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const licenseId = searchParams.get("licenseId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!licenseId) {
      return NextResponse.json({ error: "Missing licenseId" }, { status: 400 })
    }

    const history = await prisma.licenseHistory.findMany({
      where: { licenseId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error("[LICENSE_HISTORY]", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
