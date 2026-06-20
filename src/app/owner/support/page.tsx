'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button, Badge, Avatar, Modal, Spinner, EmptyState } from "@/components/ui"
import { ClientTimeAgo } from "@/components/shared/ClientTimeAgo"
import toast from "react-hot-toast"

interface Reply {
  id: string
  message: string
  isStaff: boolean
  createdAt: string
  user: { id: string; name: string | null; username: string; image: string | null }
}

interface TicketUser {
  id: string
  name: string | null
  username: string
  email: string | null
  image: string | null
}

interface Ticket {
  id: string
  subject: string
  message: string
  category: string | null
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  user: TicketUser
  replies: Reply[]
  _count?: { replies: number }
}

const statusTabs = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
]

const priorities = ["all", "low", "medium", "high", "critical"]

export default function OwnerSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const [staffList, setStaffList] = useState<TicketUser[]>([])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/tickets")
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const data = await res.json()
      setTickets(data.tickets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffUsers = async () => {
    try {
      const res = await fetch("/api/owner/users-search")
      if (!res.ok) return
      const data = await res.json()
      if (data.users) setStaffList(data.users)
    } catch {
      // staff list is optional
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchStaffUsers()
  }, [])

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
    return true
  })

  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length
  const closedToday = tickets.filter((t) => {
    if (t.status !== "closed") return false
    const closedDate = new Date(t.updatedAt)
    const today = new Date()
    return closedDate.toDateString() === today.toDateString()
  }).length

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return
    try {
      setStatusUpdating(true)
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success(`Ticket ${status.replace("_", " ")}!`)
      const data = await res.json()
      setSelectedTicket(data.ticket)
      fetchTickets()
    } catch {
      toast.error("Failed to update status")
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAssign = async (assignedTo: string) => {
    if (!selectedTicket) return
    try {
      setAssigning(true)
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      })
      if (!res.ok) throw new Error("Failed to assign ticket")
      toast.success("Ticket assigned!")
      const data = await res.json()
      setSelectedTicket(data.ticket)
      fetchTickets()
    } catch {
      toast.error("Failed to assign ticket")
    } finally {
      setAssigning(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    try {
      setReplySubmitting(true)
      const res = await fetch(`/api/tickets/${selectedTicket.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      if (!res.ok) throw new Error("Failed to send reply")
      toast.success("Reply sent!")
      setReplyText("")
      const data = await res.json()
      setSelectedTicket({
        ...selectedTicket,
        replies: [...selectedTicket.replies, data.reply],
      })
      fetchTickets()
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setReplySubmitting(false)
    }
  }

  const priorityBadge = (p: string) => {
    if (p === "critical" || p === "high") return "danger" as const
    if (p === "medium") return "warning" as const
    return "primary" as const
  }

  const statusBadge = (s: string) => {
    if (s === "open") return "primary" as const
    if (s === "in_progress") return "warning" as const
    return "secondary" as const
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Support Management</h1>
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Support Management</h1>
        <EmptyState title="Failed to load tickets" description={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Management</h1>
        <p className="text-muted-foreground mt-1">View and manage all customer support tickets across the platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-3xl font-bold mt-1">{openCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold mt-1">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Closed Today</p>
              <p className="text-3xl font-bold mt-1">{closedToday}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                statusFilter === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  statusFilter === tab.id ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                }`}>
                  {tab.id === "open" ? openCount : tab.id === "in_progress" ? inProgressCount : tickets.filter(t => t.status === "closed").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          className="input-premium w-auto text-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description="No tickets match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar name={ticket.user?.name || ticket.user?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm truncate">{ticket.subject}</span>
                      <Badge variant={priorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge variant={statusBadge(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{ticket.user?.name || ticket.user?.username}</span>
                      <span>{ticket.category}</span>
                      <span><ClientTimeAgo date={ticket.createdAt} /></span>
                      <span>{ticket.replies?.length || ticket._count?.replies || 0} replies</span>
                      {ticket.assignedTo && <span className="text-primary">Assigned</span>}
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted-foreground shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject || "Ticket Detail"}
      >
        {selectedTicket && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar name={selectedTicket.user?.name || selectedTicket.user?.username} size="md" />
              <div className="text-sm">
                <p className="font-medium">{selectedTicket.user?.name || selectedTicket.user?.username}</p>
                <p className="text-muted-foreground text-xs">@{selectedTicket.user?.username}</p>
                {selectedTicket.user?.email && (
                  <p className="text-muted-foreground text-xs">{selectedTicket.user.email}</p>
                )}
              </div>
            </div>

            {/* Ticket Meta */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="bg-muted/30 px-2 py-1 rounded">Status: <strong>{selectedTicket.status.replace("_", " ")}</strong></span>
              <span className="bg-muted/30 px-2 py-1 rounded">Priority: <strong>{selectedTicket.priority}</strong></span>
              <span className="bg-muted/30 px-2 py-1 rounded">Category: <strong>{selectedTicket.category}</strong></span>
              {selectedTicket.assignedTo && (
                <span className="bg-muted/30 px-2 py-1 rounded">Assigned to: <strong>{selectedTicket.assignedTo}</strong></span>
              )}
            </div>

            {/* Conversation */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3 max-h-72 overflow-y-auto">
              <div className="flex items-start gap-2">
                <Avatar name={selectedTicket.user?.name || selectedTicket.user?.username} size="sm" />
                <div className="bg-muted rounded-lg p-3 text-sm flex-1">
                  <div className="font-medium text-xs mb-1">{selectedTicket.user?.name || selectedTicket.user?.username}</div>
                  <p>{selectedTicket.message}</p>
                </div>
              </div>
              {selectedTicket.replies?.map((reply) => (
                <div key={reply.id} className={`flex items-start gap-2 ${reply.isStaff ? "flex-row-reverse" : ""}`}>
                  {reply.isStaff ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">SU</div>
                  ) : (
                    <Avatar name={reply.user?.name || reply.user?.username} size="sm" />
                  )}
                  <div className={`rounded-lg p-3 text-sm flex-1 ${reply.isStaff ? "bg-primary/10" : "bg-muted"}`}>
                    <div className="font-medium text-xs mb-1">{reply.isStaff ? "Support Team" : (reply.user?.name || reply.user?.username)}</div>
                    <p>{reply.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reply as Staff</label>
              <textarea
                placeholder="Type your reply..."
                className="input-premium min-h-[80px] w-full"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button className="w-full" onClick={handleSendReply} loading={replySubmitting}>Send Reply</Button>
            </div>

            {/* Actions */}
            {selectedTicket.status !== "closed" && (
              <div className="flex gap-2">
                {selectedTicket.status === "open" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus("in_progress")}
                    loading={statusUpdating}
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedTicket.status === "in_progress" && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleUpdateStatus("open")}
                    loading={statusUpdating}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleUpdateStatus("closed")}
                  loading={statusUpdating}
                >
                  Close Ticket
                </Button>
              </div>
            )}

            {/* Assign */}
            {staffList.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Staff</label>
                <div className="flex gap-2">
                  <select
                    className="input-premium flex-1"
                    value={selectedTicket.assignedTo || ""}
                    onChange={(e) => {
                      if (e.target.value) handleAssign(e.target.value)
                    }}
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
