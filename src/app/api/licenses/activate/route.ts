import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { licenseKey, hardwareId } = body

    if (!licenseKey || !hardwareId) {
      return NextResponse.json({ error: "licenseKey and hardwareId are required" }, { status: 400 })
    }

    const license = await prisma.license.findUnique({ where: { licenseKey } })
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 })
    }

    if (license.status !== "active") {
      return NextResponse.json({ error: "License is not active" }, { status: 400 })
    }

    if (license.activationCount >= license.maxActivations && license.hardwareId !== hardwareId) {
      return NextResponse.json({ error: "Max activations reached" }, { status: 400 })
    }

    await prisma.licenseHistory.create({
      data: {
        licenseId: license.id,
        action: "activate",
        details: JSON.stringify({ hardwareId }),
      },
    })

    const updateData: any = {
      activationCount: { increment: 1 },
    }

    if (!license.activatedAt) {
      updateData.activatedAt = new Date()
      updateData.activatedOn = hardwareId
    }

    if (!license.hardwareId) {
      updateData.hardwareId = hardwareId
    }

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      activationCount: updated.activationCount,
      message: "License activated successfully",
    })
  } catch (error) {
    console.error("[LICENSE_ACTIVATE]", error)
    return NextResponse.json({ error: "Activation failed" }, { status: 500 })
  }
}
