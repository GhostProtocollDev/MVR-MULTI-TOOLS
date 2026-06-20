import { NextRequest, NextResponse } from "next/server"
import { validateOwnerSession, terminateOwnerSession, terminateAllOwnerSessions } from "@/lib/owner-auth"
import { prisma } from "@/lib/prisma"

async function getOwner(req: NextRequest) {
  const token = req.cookies.get("owner_token")?.value
  if (!token) return null
  const result = await validateOwnerSession(token)
  return result.valid ? result.owner : null
}

export async function GET(req: NextRequest) {
  const owner = await getOwner(req)
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessions = await prisma.ownerSession.findMany({
    where: { ownerId: owner.id },
    orderBy: { lastUsed: "desc" },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      isActive: true,
      lastUsed: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ sessions })
}

export async function DELETE(req: NextRequest) {
  const owner = await getOwner(req)
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")
  const all = searchParams.get("all")

  if (all === "true") {
    const currentToken = req.cookies.get("owner_token")?.value
    await terminateAllOwnerSessions(owner.id, currentToken)

    const response = NextResponse.json({ success: true, message: "Other sessions terminated" })
    response.cookies.delete("owner_token")
    return response
  }

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  const terminated = await terminateOwnerSession(sessionId, owner.id)
  if (!terminated) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
