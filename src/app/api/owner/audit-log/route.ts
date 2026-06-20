import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/owner-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const owner = await getAuthenticatedOwner(req)
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const action = searchParams.get("action")

  const where: any = { ownerId: owner.id }
  if (action) where.action = { contains: action }

  const [logs, total] = await Promise.all([
    prisma.ownerAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ownerAuditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
