import { NextResponse } from "next/server"
import { requireRole } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { error, session } = await requireRole("administrator")
    if (error) return error

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const type = searchParams.get("type")

    let users: any[] = []

    if (type === "email") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { googleEmail: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          licenses: true,
          payments: true,
        },
      })
    } else if (type === "username") {
      users = await prisma.user.findMany({
        where: { username: { contains: q } },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          licenses: true,
          payments: true,
        },
      })
    } else if (type === "id") {
      const user = await prisma.user.findUnique({
        where: { id: q },
        include: {
          licenses: true,
          payments: true,
        },
      })
      users = user ? [user] : []
    } else if (type === "license") {
      const license = await prisma.license.findFirst({
        where: { licenseKey: { contains: q } },
        include: { user: { include: { licenses: true, payments: true } } },
      })
      users = license?.user ? [license.user] : []
    } else if (type === "payment") {
      const payment = await prisma.payment.findFirst({
        where: { id: { contains: q } },
        include: { user: { include: { licenses: true, payments: true } } },
      })
      users = payment?.user ? [payment.user] : []
    } else {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q } },
            { googleEmail: { contains: q } },
            { username: { contains: q } },
          ],
        },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          licenses: true,
          payments: true,
        },
      })
    }

    const mapped = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      googleEmail: u.googleEmail,
      image: u.image,
      role: u.role,
      banned: u.banned,
      createdAt: u.createdAt,
      loginCount: u.loginCount,
      lastLoginAt: u.lastLoginAt,
      licenses: u.licenses,
      payments: u.payments,
    }))

    return NextResponse.json({ users: mapped })
  } catch (error) {
    console.error("[USER_SEARCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
