import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveIp } from "@/lib/geo"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { builderUuid, clientId, certificate, hostname, user, os, hardwareId, ipPublic, ipLocal } = body

    if (!builderUuid || !clientId) {
      return NextResponse.json({ error: "builderUuid and clientId required" }, { status: 400 })
    }

    const builder = await prisma.builder.findUnique({ where: { uuid: builderUuid } })
    if (!builder || !builder.isActive) {
      return NextResponse.json({ error: "Builder not found or inactive" }, { status: 403 })
    }

    let fingerprint: string | null = null
    if (certificate) {
      const certData = JSON.parse(certificate)
      fingerprint = certData.fingerprint
    }

    const targetIp = ipPublic || ipLocal || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""

    let geo: { country: string; countryCode: string; city: string; isp: string } | null = null
    if (targetIp) {
      geo = await resolveIp(targetIp.split(",")[0].trim())
    }

    const client = await prisma.remoteClient.upsert({
      where: { clientId },
      update: {
        hostname: hostname || undefined,
        user: user || undefined,
        os: os || undefined,
        hardwareId: hardwareId || undefined,
        ipPublic: ipPublic || undefined,
        ipLocal: ipLocal || undefined,
        certificate: certificate || undefined,
        fingerprint: fingerprint || undefined,
        country: geo?.country || undefined,
        countryCode: geo?.countryCode || undefined,
        city: geo?.city || undefined,
        isp: geo?.isp || undefined,
        status: "online",
        lastSeen: new Date(),
        isVerified: true,
      },
      create: {
        clientId,
        builderId: builder.id,
        hostname: hostname || "Unknown",
        user: user || "Unknown",
        os: os || "Unknown",
        hardwareId: hardwareId || undefined,
        ipPublic: ipPublic || undefined,
        ipLocal: ipLocal || undefined,
        certificate: certificate || undefined,
        fingerprint: fingerprint || undefined,
        country: geo?.country || undefined,
        countryCode: geo?.countryCode || undefined,
        city: geo?.city || undefined,
        isp: geo?.isp || undefined,
        status: "online",
        isVerified: true,
      },
    })

    await prisma.clientSession.create({
      data: {
        clientId: client.id,
        type: "websocket",
        status: "active",
        ip: ipPublic || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      clientId: client.id,
      serverFingerprint: crypto.createHash("sha256").update("GHOST-REMOTE-SERVER").digest("hex"),
    })
  } catch (error) {
    console.error("[REMOTE_REGISTER]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
