import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const builders = await prisma.builder.findMany({
      include: { _count: { select: { clients: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ builders })
  } catch (error) {
    console.error("[BUILDERS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const uuid = crypto.randomUUID()
    const fingerprint = crypto.createHash("sha256").update(uuid + Date.now()).digest("hex")
    const certSerial = crypto.randomBytes(16).toString("hex")

    const builder = await prisma.builder.create({
      data: {
        uuid,
        name: body.name || `Builder-${uuid.slice(0, 8)}`,
        description: body.description || null,
        country: body.country || null,
        certificate: JSON.stringify({
          serial: certSerial,
          algorithm: "SHA256withRSA",
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 86400000 * 5).toISOString(),
          fingerprint,
          publicKey: crypto.randomBytes(64).toString("hex"),
        }),
        fingerprint,
        allowedDomains: body.allowedDomains || null,
      },
    })

    return NextResponse.json({ builder })
  } catch (error) {
    console.error("[BUILDERS_POST]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
