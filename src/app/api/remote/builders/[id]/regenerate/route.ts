import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const existing = await prisma.builder.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Builder not found" }, { status: 404 })
    }

    const fingerprint = crypto.createHash("sha256").update(existing.uuid + Date.now()).digest("hex")
    const certSerial = crypto.randomBytes(16).toString("hex")

    const builder = await prisma.builder.update({
      where: { id: params.id },
      data: {
        certificate: JSON.stringify({
          serial: certSerial,
          algorithm: "SHA256withRSA",
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 86400000 * 5).toISOString(),
          fingerprint,
          publicKey: crypto.randomBytes(64).toString("hex"),
        }),
        fingerprint,
      },
    })

    return NextResponse.json({ builder })
  } catch (error) {
    console.error("[BUILDER_REGENERATE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
