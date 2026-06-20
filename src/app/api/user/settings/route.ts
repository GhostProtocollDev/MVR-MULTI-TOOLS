import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    let settings = await prisma.userSettings.findUnique({ where: { userId } })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[USER_SETTINGS_GET]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()

    const data: any = {}
    if (body.theme !== undefined) data.theme = body.theme
    if (body.accentColor !== undefined) data.accentColor = body.accentColor
    if (body.background !== undefined) data.background = body.background
    if (body.blur !== undefined) data.blur = body.blur
    if (body.motionBlur !== undefined) data.motionBlur = body.motionBlur
    if (body.transparency !== undefined) data.transparency = body.transparency
    if (body.brightness !== undefined) data.brightness = body.brightness
    if (body.contrast !== undefined) data.contrast = body.contrast
    if (body.saturation !== undefined) data.saturation = body.saturation
    if (body.scale !== undefined) data.scale = body.scale
    if (body.textSize !== undefined) data.textSize = body.textSize
    if (body.animationsEnabled !== undefined) data.animationsEnabled = body.animationsEnabled
    if (body.bgIntensity !== undefined) data.bgIntensity = body.bgIntensity

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[USER_SETTINGS_PUT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
