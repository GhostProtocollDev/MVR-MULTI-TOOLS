import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserLicense } from "@/lib/license"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 })
    }

    const license = await getUserLicense(userId)
    return NextResponse.json({ license })
  } catch (error) {
    console.error("[USER_LICENSE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
