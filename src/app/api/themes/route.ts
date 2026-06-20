import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    const role = (session?.user as any)?.role
    const isStaff = role === "owner" || role === "administrator"

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const myThemes = searchParams.get("my") === "true"

    const where: any = {}

    if (myThemes && userId) {
      where.userId = userId
    } else if (category && category !== "all") {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (!userId) {
      where.isPublic = true
    } else if (!myThemes && !isStaff) {
      where.OR = [
        { isPublic: true },
        { userId: userId },
      ]
    }

    const themes = await prisma.theme.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ featured: "desc" }, { downloads: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("[THEMES_GET]", error)
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()
    const { name, description, slug, type, category, isPublic, config, wallpaper, background, accentColor, featured, isPremium } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let finalSlug = slug || slugify(name)

    const existing = await prisma.theme.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        description: description || null,
        slug: finalSlug,
        type: type || "custom",
        category: category || null,
        isPublic: isPublic || false,
        config: config || "{}",
        wallpaper: wallpaper || null,
        background: background || null,
        accentColor: accentColor || null,
        featured: featured || false,
        isPremium: isPremium || false,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
      },
    })

    return NextResponse.json({ theme }, { status: 201 })
  } catch (error) {
    console.error("[THEMES_POST]", error)
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const role = (session.user as any).role
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const existing = await prisma.theme.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const isOwner = role === "owner" || role === "administrator"
    if (!isOwner && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: fields,
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
      },
    })

    return NextResponse.json({ theme })
  } catch (error) {
    console.error("[THEMES_PATCH]", error)
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const role = (session.user as any).role
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const existing = await prisma.theme.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const isOwner = role === "owner" || role === "administrator"
    if (!isOwner && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.review.deleteMany({ where: { themeId: id } })
    await prisma.theme.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[THEMES_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 })
  }
}
