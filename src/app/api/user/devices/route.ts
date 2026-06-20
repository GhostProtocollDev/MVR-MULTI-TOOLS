import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const devices = await prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastUsed: "desc" },
    })

    return NextResponse.json({ devices })
  } catch (error) {
    console.error("[USER_DEVICES_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { deviceId } = await req.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    const device = await prisma.userDevice.findFirst({
      where: { id: deviceId, userId },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    await prisma.userDevice.delete({ where: { id: deviceId } })

    return NextResponse.json({ success: true, message: "Device removed" })
  } catch (error) {
    console.error("[USER_DEVICES_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
