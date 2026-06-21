import { NextRequest, NextResponse } from "next/server"

const API_BASE = "https://www.1secmail.com/api/v1/"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action") || "genRandomMailbox"

    const params = new URLSearchParams()
    params.set("action", action)

    if (action === "getMessages") {
      const login = searchParams.get("login")
      const domain = searchParams.get("domain")
      if (!login || !domain) return NextResponse.json({ error: "login and domain required" }, { status: 400 })
      params.set("login", login)
      params.set("domain", domain)
    } else if (action === "readMessage") {
      const login = searchParams.get("login")
      const domain = searchParams.get("domain")
      const id = searchParams.get("id")
      if (!login || !domain || !id) return NextResponse.json({ error: "login, domain, id required" }, { status: 400 })
      params.set("login", login)
      params.set("domain", domain)
      params.set("id", id)
    } else if (action === "genRandomMailbox") {
      params.set("count", searchParams.get("count") || "1")
    }

    const res = await fetch(`${API_BASE}?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[TEMPMAIL]", error)
    return NextResponse.json({ error: "Failed to connect to email service" }, { status: 500 })
  }
}
