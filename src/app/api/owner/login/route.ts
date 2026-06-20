import { NextRequest, NextResponse } from "next/server"
import { authenticateOwner, initializeOwnerAccount } from "@/lib/owner-auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    await initializeOwnerAccount()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || undefined

    const result = await authenticateOwner(username, password, ip, userAgent)

    if (!result.success) {
      return NextResponse.json({ error: result.reason || "Authentication failed" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
    })

    response.cookies.set("owner_token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/owner",
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
