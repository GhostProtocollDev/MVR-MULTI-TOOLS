import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/owner-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const owner = await getAuthenticatedOwner(req)
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

  const [totalRevenue, activeLicenses, totalCustomers, pendingTickets, recentPayments, activeSessions] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    prisma.license.count({ where: { status: "active" } }),
    prisma.user.count(),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: true } }),
    owner.isNextAuth
      ? Promise.resolve(0)
      : prisma.ownerSession.count({ where: { isActive: true, ownerId: owner.id } }),
  ])

  const recentRegistrations = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  const recentActivations = await prisma.license.findMany({ where: { activatedAt: { not: null } }, orderBy: { activatedAt: "desc" }, take: 10, include: { user: true } })

  const paymentsByMonth = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo }, status: "paid" },
    _sum: { amount: true },
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const revenueByMonth = months.map((month, i) => {
    const monthPayments = paymentsByMonth.filter((p) => {
      const d = new Date(p.createdAt)
      return d.getMonth() === i && d.getFullYear() === now.getFullYear()
    })
    return { month, revenue: monthPayments.reduce((sum, p) => sum + (p._sum.amount || 0), 0) }
  })

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } })
  const licensesByPlan = await Promise.all(
    plans.map(async (plan) => {
      const count = await prisma.license.count({ where: { planId: plan.id } })
      return { name: plan.name, count, revenue: (plan.price * count) }
    })
  )

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.amount || 0,
    activeLicenses,
    totalCustomers,
    pendingTickets,
    activeSessions,
    revenueByMonth,
    plans: licensesByPlan,
    recentPayments,
    recentRegistrations,
    recentActivations,
  })
}
