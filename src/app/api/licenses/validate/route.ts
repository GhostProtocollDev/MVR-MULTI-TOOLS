import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { licenseKey, hardwareId } = body

    if (!licenseKey) {
      return NextResponse.json({ valid: false, message: "License key is required" }, { status: 400 })
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey },
    })

    if (!license) {
      return NextResponse.json({ valid: false, message: "License not found" })
    }

    const response = {
      status: license.status,
      expiresAt: license.expiresAt,
      isLifetime: license.isLifetime,
      assignedRole: license.assignedRole,
      hardwareId: license.hardwareId,
      maxActivations: license.maxActivations,
      activationCount: license.activationCount,
    }

    if (license.isLifetime && license.status === "active") {
      return NextResponse.json({
        valid: true,
        license: response,
        message: "License is valid (lifetime)",
      })
    }

    if (license.status === "suspended") {
      return NextResponse.json({ valid: false, message: "License is suspended" })
    }

    if (license.status === "revoked") {
      return NextResponse.json({ valid: false, message: "License has been revoked" })
    }

    if (license.status === "expired" || license.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, message: "License has expired" })
    }

    if (hardwareId) {
      if (license.hardwareId === hardwareId) {
        return NextResponse.json({
          valid: true,
          license: response,
          message: "License is valid",
        })
      }

      if (!license.hardwareId && license.activationCount < license.maxActivations) {
        const updated = await prisma.license.update({
          where: { id: license.id },
          data: {
            hardwareId,
            activatedAt: license.activatedAt || new Date(),
            activatedOn: license.activatedOn || hardwareId,
            activationCount: { increment: 1 },
          },
        })

        return NextResponse.json({
          valid: true,
          license: {
            ...response,
            hardwareId,
            activationCount: updated.activationCount,
          },
          message: "License activated on this device",
        })
      }

      return NextResponse.json({
        valid: false,
        message: `License already activated on another device (${license.activationCount}/${license.maxActivations} activations used)`,
      })
    }

    if (license.status === "active") {
      return NextResponse.json({
        valid: true,
        license: response,
        message: "License is valid",
      })
    }

    return NextResponse.json({ valid: false, message: "License is not active" })
  } catch (error) {
    console.error("[LICENSE_VALIDATE]", error)
    return NextResponse.json({ valid: false, message: "Validation error" }, { status: 500 })
  }
}
