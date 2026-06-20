'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, Spinner, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui"
import toast from "react-hot-toast"
import { usePaymentEvents } from "@/lib/use-sse"

interface PaymentUser {
  id: string
  username: string
  email: string | null
  googleEmail: string | null
  image: string | null
}

interface PaymentLicense {
  id: string
  licenseKey: string
  planId: string | null
}

interface Payment {
  id: string
  userId: string
  licenseId: string | null
  planId: string | null
  amount: number
  currency: string
  status: string
  method: string | null
  transactionId: string | null
  description: string | null
  reviewStatus: string
  priority: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  user: PaymentUser
  license: PaymentLicense | null
}

interface PaymentStats {
  waitingReview: number
  highPriority: number
  recentlyApproved: number
  recentlyRejected: number
}

interface InternalNote {
  id: string
  content: string
  authorId: string
  targetType: string
  targetId: string
  isPinned: boolean
  createdAt: string
  editedAt: string | null
  author: { id: string; username: string; image: string | null }
}

interface ActivityEntry {
  id: string
  action: string
  details: string | null
  createdAt: string
}

const INITIAL_STATS: PaymentStats = {
  waitingReview: 0, highPriority: 0, recentlyApproved: 0, recentlyRejected: 0,
}

const PLAN_OPTIONS = [
  { value: "", label: "All Plans" },
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
]

const METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Crypto", label: "Crypto" },
  { value: "PayPal", label: "PayPal" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Cash", label: "Cash" },
  { value: "Gift Card", label: "Gift Card" },
  { value: "Other", label: "Other" },
]

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const STATUS_TABS = ["all", "pending", "approved", "rejected", "refunded"]

const statusColors: Record<string, string> = {
  pending: "#EAB308",
  approved: "#22C55E",
  rejected: "#EF4444",
  refunded: "#8B5CF6",
}

const priorityColors: Record<string, string> = {
  normal: "#6B7280",
  medium: "#EAB308",
  high: "#EF4444",
}

const methodIcons: Record<string, string> = {
  "Bank Transfer": "\uD83C\uDFE6",
  Crypto: "\u20BF",
  PayPal: "\uD83D\uDCB3",
  "Credit Card": "\uD83D\uDCB3",
  Cash: "\uD83D\uDCB5",
  "Gift Card": "\uD83C\uDF81",
  Other: "\uD83D\uDCB0",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 flex flex-col"
      style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
      </div>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wider mt-1" style={{ color: `${color}99` }}>{label}</span>
    </motion.div>
  )
}

function UserAvatar({ user }: { user: PaymentUser }) {
  const name = user.username || user.email || "U"
  const initial = name.charAt(0).toUpperCase()
  const colors = [
    "from-red-500 to-rose-600",
    "from-blue-500 to-indigo-600",
    "from-green-500 to-emerald-600",
    "from-purple-500 to-violet-600",
    "from-orange-500 to-amber-600",
    "from-teal-500 to-cyan-600",
  ]
  const colorIdx = user.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {initial}
    </div>
  )
}

export default function OwnerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>(INITIAL_STATS)
  const [loading, setLoading] = useState(true)

  const [statusTab, setStatusTab] = useState("pending")
  const [methodFilter, setMethodFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [search, setSearch] = useState("")

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [detailModal, setDetailModal] = useState<Payment | null>(null)
  const [detailNotes, setDetailNotes] = useState<InternalNote[]>([])
  const [detailActivity, setDetailActivity] = useState<ActivityEntry[]>([])
  const [noteText, setNoteText] = useState("")
  const [noteLoading, setNoteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ action: string; label: string } | null>(null)

  const lastEventRef = useRef<string | null>(null)

  usePaymentEvents((event) => {
    const eventId = `${event.type}-${event.paymentId}-${event.timestamp}`
    if (lastEventRef.current === eventId) return
    lastEventRef.current = eventId

    if (event.type === "payment_created") {
      toast.success(
        `New payment: ${event.username} - $${event.amount.toFixed(2)}`,
        { duration: 5000, icon: "\uD83D\uDCB0" }
      )
    } else {
      toast(
        `Payment ${event.reviewStatus}: ${event.username} - $${event.amount.toFixed(2)}`,
        { duration: 4000, icon: event.reviewStatus === "approved" ? "\u2705" : event.reviewStatus === "rejected" ? "\u274C" : "\uD83D\uDD04" }
      )
    }
    fetchPayments()
  })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusTab !== "all") params.set("reviewStatus", statusTab)
      if (methodFilter) params.set("method", methodFilter)
      if (priorityFilter) params.set("priority", priorityFilter)
      if (planFilter) params.set("planId", planFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      if (search) params.set("search", search)
      params.set("limit", "100")

      const res = await fetch(`/api/owner/payments?${params.toString()}`)
      if (!res.ok) { toast.error("Failed to fetch payments"); return }
      const data = await res.json()
      setPayments(data.payments || [])
      setStats(data.stats || INITIAL_STATS)
    } catch {
      toast.error("Network error fetching payments")
    } finally {
      setLoading(false)
    }
  }, [statusTab, methodFilter, priorityFilter, planFilter, dateFrom, dateTo, search])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === payments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(payments.map((p) => p.id)))
    }
  }

  async function performBulkAction(action: string) {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch("/api/owner/payments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIds: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)}d ${selectedIds.size} payment(s)`)
        setSelectedIds(new Set())
        fetchPayments()
      } else {
        const data = await res.json()
        toast.error(data.error || "Bulk action failed")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleSingleAction(payment: Payment, reviewStatus: string) {
    setActionLoading(true)
    try {
      const res = await fetch("/api/owner/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, reviewStatus }),
      })
      if (res.ok) {
        toast.success(`Payment ${reviewStatus} successfully`)
        setConfirmAction(null)
        setDetailModal(null)
        fetchPayments()
      } else {
        const data = await res.json()
        toast.error(data.error || "Action failed")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setActionLoading(false)
    }
  }

  async function openDetail(payment: Payment) {
    setDetailModal(payment)
    setConfirmAction(null)
    setNoteText("")
    fetchDetailNotes(payment.id)
    fetchDetailActivity(payment.id)
  }

  async function fetchDetailNotes(paymentId: string) {
    try {
      const res = await fetch(`/api/owner/notes?targetType=payment&targetId=${paymentId}`)
      if (res.ok) {
        const data = await res.json()
        setDetailNotes(data)
      }
    } catch { /* silent */ }
  }

  async function fetchDetailActivity(paymentId: string) {
    try {
      const res = await fetch(`/api/owner/audit-log?action=PAYMENT_&limit=20`)
      if (res.ok) {
        const data = await res.json()
        const filtered = (data.logs || []).filter(
          (log: any) => log.details && log.details.includes(paymentId)
        )
        setDetailActivity(filtered)
      }
    } catch { /* silent */ }
  }

  async function addNote() {
    if (!noteText.trim() || !detailModal) return
    setNoteLoading(true)
    try {
      const res = await fetch("/api/owner/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText, targetType: "payment", targetId: detailModal.id }),
      })
      if (res.ok) {
        toast.success("Note added")
        setNoteText("")
        fetchDetailNotes(detailModal.id)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add note")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setNoteLoading(false)
    }
  }

  function getMethodLabel(method: string | null): string {
    if (!method) return "—"
    return `${methodIcons[method] || "\uD83D\uDCB0"} ${method}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Review Queue</h1>
          <p className="text-zinc-400 text-sm mt-1">Review and manage payment submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const params = new URLSearchParams()
              if (statusTab !== "all") params.set("reviewStatus", statusTab)
              if (methodFilter) params.set("method", methodFilter)
              if (priorityFilter) params.set("priority", priorityFilter)
              if (planFilter) params.set("planId", planFilter)
              if (dateFrom) params.set("dateFrom", dateFrom)
              if (dateTo) params.set("dateTo", dateTo)
              if (search) params.set("search", search)
              window.open(`/api/owner/payments/export?format=csv&${params.toString()}`, "_blank")
            }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const params = new URLSearchParams()
              if (statusTab !== "all") params.set("reviewStatus", statusTab)
              if (methodFilter) params.set("method", methodFilter)
              if (priorityFilter) params.set("priority", priorityFilter)
              if (planFilter) params.set("planId", planFilter)
              if (dateFrom) params.set("dateFrom", dateFrom)
              if (dateTo) params.set("dateTo", dateTo)
              if (search) params.set("search", search)
              window.open(`/api/owner/payments/export?format=json&${params.toString()}`, "_blank")
            }}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            JSON
          </Button>
          <Button variant="outline" className="text-xs" onClick={fetchPayments} loading={loading}>
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Payments Waiting Review" value={stats.waitingReview} icon={"\u26A0\uFE0F"} color="#EAB308" />
        <StatCard label="High Priority Reviews" value={stats.highPriority} icon={"\uD83D\uDD25"} color="#EF4444" />
        <StatCard label="Recently Approved" value={stats.recentlyApproved} icon={"\u2705"} color="#22C55E" />
        <StatCard label="Recently Rejected" value={stats.recentlyRejected} icon={"\u274C"} color="#EF4444" />
      </div>

      {/* Filters Row */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatusTab(tab); setSelectedIds(new Set()) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                statusTab === tab
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={METHOD_OPTIONS}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={PRIORITY_OPTIONS}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={PLAN_OPTIONS}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-36"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-premium w-36 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-premium w-36 text-sm"
          />
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search by username/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50"
          >
            <span className="text-sm text-zinc-300 font-medium">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-zinc-700" />
            <Button
              variant="primary"
              size="sm"
              loading={bulkLoading}
              onClick={() => performBulkAction("approve")}
              className="bg-green-600 hover:bg-green-500 text-xs"
            >
              Approve Selected
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={bulkLoading}
              onClick={() => performBulkAction("reject")}
              className="text-xs"
            >
              Reject Selected
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={bulkLoading}
              onClick={() => performBulkAction("refund")}
              className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs"
            >
              Refund Selected
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-zinc-400 hover:text-zinc-200 ml-auto transition-colors"
            >
              Clear selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description={
              statusTab !== "all"
                ? `No payments with status "${statusTab}" match your filters`
                : "No payment submissions to review"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === payments.length && payments.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-zinc-600 bg-zinc-800"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(payment)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(payment.id)}
                        onChange={() => toggleSelect(payment.id)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={payment.user} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-white font-medium truncate">{payment.user.username}</span>
                          <span className="text-xs text-zinc-500 truncate">
                            {payment.user.email || payment.user.googleEmail || ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-white">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: payment.currency }).format(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-300">{getMethodLabel(payment.method)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-400">
                        {payment.license?.planId || payment.description || "\u2014"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        payment.priority === "high" ? "danger" :
                        payment.priority === "medium" ? "warning" : "secondary"
                      }>
                        {payment.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        payment.reviewStatus === "approved" ? "success" :
                        payment.reviewStatus === "rejected" ? "danger" :
                        payment.reviewStatus === "refunded" ? "secondary" : "warning"
                      }>
                        {payment.reviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">{formatDate(payment.createdAt)}</span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {payment.reviewStatus === "pending" && (
                          <>
                            <button
                              onClick={() => { setDetailModal(payment); setConfirmAction({ action: "approved", label: "Approve" }) }}
                              className="text-[11px] px-2 py-1 rounded-md font-medium transition-all duration-150 hover:scale-105"
                              style={{ color: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setDetailModal(payment); setConfirmAction({ action: "rejected", label: "Reject" }) }}
                              className="text-[11px] px-2 py-1 rounded-md font-medium transition-all duration-150 hover:scale-105"
                              style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.15)" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payment.reviewStatus === "approved" && (
                          <button
                            onClick={() => { setDetailModal(payment); setConfirmAction({ action: "refunded", label: "Refund" }) }}
                            className="text-[11px] px-2 py-1 rounded-md font-medium transition-all duration-150 hover:scale-105"
                            style={{ color: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.15)" }}
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => { setDetailModal(null); setConfirmAction(null) }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {detailModal.currency}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Payment Details</h2>
                    <p className="text-xs text-zinc-500">ID: {detailModal.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setDetailModal(null); setConfirmAction(null) }}
                  className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Amount</span>
                    <p className="text-xl font-bold text-white">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: detailModal.currency }).format(detailModal.amount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Method</span>
                    <p className="text-sm text-zinc-300">{getMethodLabel(detailModal.method)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</span>
                    <Badge variant={
                      detailModal.reviewStatus === "approved" ? "success" :
                      detailModal.reviewStatus === "rejected" ? "danger" :
                      detailModal.reviewStatus === "refunded" ? "secondary" : "warning"
                    }>
                      {detailModal.reviewStatus}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Priority</span>
                    <Badge variant={
                      detailModal.priority === "high" ? "danger" :
                      detailModal.priority === "medium" ? "warning" : "secondary"
                    }>
                      {detailModal.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Transaction ID</span>
                    <p className="text-sm text-zinc-400 font-mono">{detailModal.transactionId || "\u2014"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Date</span>
                    <p className="text-sm text-zinc-400">{formatDate(detailModal.createdAt)}</p>
                  </div>
                  {detailModal.description && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Description</span>
                      <p className="text-sm text-zinc-300">{detailModal.description}</p>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="rounded-xl border border-zinc-800 p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3 block">User Information</span>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={detailModal.user} />
                    <div>
                      <p className="text-sm font-medium text-white">{detailModal.user.username}</p>
                      <p className="text-xs text-zinc-400">{detailModal.user.email || "\u2014"}</p>
                      {detailModal.user.googleEmail && (
                        <p className="text-xs text-zinc-500">Google: {detailModal.user.googleEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirmation Step */}
                {confirmAction && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: confirmAction.action === "approved" ? "rgba(34,197,94,0.3)" :
                        confirmAction.action === "refunded" ? "rgba(139,92,246,0.3)" : "rgba(239,68,68,0.3)",
                      backgroundColor: confirmAction.action === "approved" ? "rgba(34,197,94,0.05)" :
                        confirmAction.action === "refunded" ? "rgba(139,92,246,0.05)" : "rgba(239,68,68,0.05)",
                    }}
                  >
                    <p className="text-sm text-zinc-300 mb-3">
                      Are you sure you want to <strong>{confirmAction.label.toLowerCase()}</strong> this payment of{" "}
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: detailModal.currency }).format(detailModal.amount)}?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant={confirmAction.action === "approved" ? "primary" : confirmAction.action === "refunded" ? "secondary" : "danger"}
                        loading={actionLoading}
                        onClick={() => handleSingleAction(detailModal, confirmAction.action)}
                        className={confirmAction.action === "refunded" ? "bg-purple-600 hover:bg-purple-500" : ""}
                      >
                        {confirmAction.label}
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Quick Actions (when no confirmation shown) */}
                {!confirmAction && (
                  <div className="flex flex-wrap gap-2">
                    {detailModal.reviewStatus === "pending" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-500"
                          onClick={() => setConfirmAction({ action: "approved", label: "Approve" })}
                        >
                          Approve Payment
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmAction({ action: "rejected", label: "Reject" })}
                        >
                          Reject Payment
                        </Button>
                      </>
                    )}
                    {detailModal.reviewStatus === "approved" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-500 text-white"
                        onClick={() => setConfirmAction({ action: "refunded", label: "Refund" })}
                      >
                        Refund Payment
                      </Button>
                    )}
                  </div>
                )}

                {/* Internal Notes */}
                <div className="space-y-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">Internal Notes</span>
                  {detailNotes.length === 0 ? (
                    <p className="text-sm text-zinc-500">No notes yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detailNotes.map((note) => (
                        <div key={note.id} className="flex gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5">
                            {note.author.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-zinc-300">{note.author.username}</span>
                              <span className="text-[10px] text-zinc-600">{formatDate(note.createdAt)}</span>
                              {note.isPinned && <span className="text-[10px] text-yellow-400">PINNED</span>}
                            </div>
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote() } }}
                      className="flex-1 input-premium text-sm"
                    />
                    <Button size="sm" onClick={addNote} loading={noteLoading} disabled={!noteText.trim()}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Timeline / Activity */}
                <div className="space-y-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">Activity Timeline</span>
                  {detailActivity.length === 0 ? (
                    <p className="text-sm text-zinc-500">No activity recorded</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detailActivity.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 p-2">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                            backgroundColor: entry.action.includes("APPROVED") ? "#22C55E" :
                              entry.action.includes("REJECTED") ? "#EF4444" :
                              entry.action.includes("REFUNDED") ? "#8B5CF6" : "#6B7280",
                          }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-300">
                                {entry.action.replace(/_/g, " ").toLowerCase()
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              <span className="text-[10px] text-zinc-600">{formatDate(entry.createdAt)}</span>
                            </div>
                            {entry.details && (
                              <p className="text-xs text-zinc-500 mt-0.5 truncate">{entry.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
