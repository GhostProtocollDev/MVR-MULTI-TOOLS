import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, logActivity } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { email, name, image, googleId } = await req.json()
    const googleEmail = email

    if (!googleEmail) {
      return NextResponse.json({ error: "Google email is required" }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { googleEmail, id: { not: userId } },
    })

    if (existing) {
      return NextResponse.json({ error: "This Google account is already linked to another user" }, { status: 409 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleEmail,
        image: image || undefined,
        name: name || undefined,
      },
    })

    await logActivity(userId, "google_link", `Linked Google account: ${googleEmail}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GOOGLE_LINK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
