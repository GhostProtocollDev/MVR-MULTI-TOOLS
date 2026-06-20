import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    await prisma.user.update({
      where: { id: userId },
      data: { googleEmail: null },
    })

    await logActivity(userId, "google_unlink", "Unlinked Google account")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GOOGLE_UNLINK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
