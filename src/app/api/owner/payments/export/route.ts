import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const reviewStatus = searchParams.get("reviewStatus")
    const method = searchParams.get("method")
    const priority = searchParams.get("priority")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search")

    const where: any = {}
    if (reviewStatus && reviewStatus !== "all") where.reviewStatus = reviewStatus
    if (method) where.method = method
    if (priority) where.priority = priority
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.user = {
        OR: [
          { username: { contains: search } },
          { email: { contains: search } },
          { googleEmail: { contains: search } },
        ],
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true, googleEmail: true } },
        license: { select: { id: true, licenseKey: true, planId: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    if (format === "json") {
      return new NextResponse(JSON.stringify(payments, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="payments-export-${Date.now()}.json"`,
        },
      })
    }

    const headers = [
      "ID", "User ID", "Username", "Email", "Google Email",
      "Amount", "Currency", "Status", "Review Status", "Priority",
      "Method", "Transaction ID", "Description", "License Key",
      "Reviewed By", "Reviewed At", "Created At", "Updated At",
    ].join(",")

    const rows = payments.map((p) =>
      [
        p.id,
        p.userId,
        csvEscape(p.user.username),
        csvEscape(p.user.email || ""),
        csvEscape(p.user.googleEmail || ""),
        p.amount,
        p.currency,
        p.status,
        p.reviewStatus,
        p.priority,
        csvEscape(p.method || ""),
        csvEscape(p.transactionId || ""),
        csvEscape(p.description || ""),
        csvEscape(p.license?.licenseKey || ""),
        csvEscape(p.reviewedBy || ""),
        p.reviewedAt ? new Date(p.reviewedAt).toISOString() : "",
        new Date(p.createdAt).toISOString(),
        new Date(p.updatedAt).toISOString(),
      ].join(",")
    )

    const csv = `${headers}\n${rows.join("\n")}`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payments-export-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error("[OWNER_PAYMENTS_EXPORT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}
