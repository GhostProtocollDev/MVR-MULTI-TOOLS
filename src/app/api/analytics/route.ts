import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const role = (session.user as any)?.role
    if (role !== "owner" && role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const [totalRevenue, totalCustomers, activeLicenses, pendingTickets, payments, recentPayments, recentUsers, revenueData] =
      await Promise.all([
        prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
        prisma.user.count(),
        prisma.license.count({ where: { status: "active" } }),
        prisma.ticket.count({ where: { status: "open" } }),
        prisma.payment.findMany({ where: { status: "paid" }, orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.payment.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: thirtyDaysAgo }, status: "paid" },
          _sum: { amount: true },
        }),
      ])

    // Generate revenue data by month for chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const revenueByMonth = months.map((month, i) => {
      const monthPayments = payments.filter((p) => {
        const d = new Date(p.createdAt)
        return d.getMonth() === i && d.getFullYear() === now.getFullYear()
      })
      return {
        month,
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      }
    })

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalCustomers,
      activeLicenses,
      pendingTickets,
      revenueData: revenueByMonth,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
