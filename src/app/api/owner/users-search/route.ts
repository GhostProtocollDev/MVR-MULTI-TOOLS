import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator" && role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, name: true, email: true, role: true, banned: true, createdAt: true,
        _count: { select: { licenses: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[USERS_SEARCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, action, newRole } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const actorId = (session?.user as any)?.id
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (action === "ban") {
      await prisma.user.update({ where: { id: userId }, data: { banned: true } })
      await prisma.activityLog.create({
        data: { userId: actorId, action: "USER_BANNED", details: `User ${userId} was banned` },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "unban") {
      await prisma.user.update({ where: { id: userId }, data: { banned: false } })
      await prisma.activityLog.create({
        data: { userId: actorId, action: "USER_UNBANNED", details: `User ${userId} was unbanned` },
      })
      return NextResponse.json({ success: true })
    }

    if (newRole) {
      await prisma.user.update({ where: { id: userId }, data: { role: newRole } })
      await prisma.activityLog.create({
        data: { userId: actorId, action: "USER_ROLE_CHANGED", details: `User ${userId} role changed to ${newRole}` },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[USERS_PUT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
