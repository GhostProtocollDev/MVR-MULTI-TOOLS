import { NextRequest, NextResponse } from "next/server"
import { initiateOwnerRecovery, executeOwnerRecovery } from "@/lib/owner-auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, username, recoveryCode, newLicense, newPassword } = body

    if (action === "request") {
      if (!username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 })
      }
      const result = await initiateOwnerRecovery(username)
      return NextResponse.json(result)
    }

    if (action === "execute") {
      if (!recoveryCode || !newLicense || !newPassword) {
        return NextResponse.json({ error: "Recovery code, new license, and new password required" }, { status: 400 })
      }

      const ip = req.headers.get("x-forwarded-for") || undefined
      const userAgent = req.headers.get("user-agent") || undefined

      const result = await executeOwnerRecovery(recoveryCode, newLicense, newPassword, ip, userAgent)
      if (!result.success) {
        return NextResponse.json({ error: result.reason }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: "Recovery completed. Use your new credentials to log in." })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
