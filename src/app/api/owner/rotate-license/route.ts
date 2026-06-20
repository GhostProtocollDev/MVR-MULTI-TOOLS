import { NextRequest, NextResponse } from "next/server"
import { validateOwnerSession, rotateOwnerLicense, replaceOwnerLicense } from "@/lib/owner-auth"

async function getOwner(req: NextRequest) {
  const token = req.cookies.get("owner_token")?.value
  if (!token) return null
  const result = await validateOwnerSession(token)
  return result.valid ? result.owner : null
}

export async function POST(req: NextRequest) {
  const owner = await getOwner(req)
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action, currentLicense, newLicense } = body

  if (!newLicense) {
    return NextResponse.json({ error: "New license key required" }, { status: 400 })
  }

  const ip = req.headers.get("x-forwarded-for") || undefined
  const userAgent = req.headers.get("user-agent") || undefined

  if (action === "rotate") {
    if (!currentLicense) {
      return NextResponse.json({ error: "Current license required for rotation" }, { status: 400 })
    }
    const result = await rotateOwnerLicense(owner.id, currentLicense, newLicense, ip, userAgent)
    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: "License rotated", licenseKey: result.newKey })
  }

  if (action === "replace") {
    const result = await replaceOwnerLicense(owner.id, newLicense, ip, userAgent)
    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: "License replaced" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
