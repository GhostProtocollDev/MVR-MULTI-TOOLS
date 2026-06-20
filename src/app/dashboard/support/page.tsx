'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, Button, Badge, Input, Avatar, Modal, Tabs, Spinner, EmptyState } from "@/components/ui"
import { ClientTimeAgo } from "@/components/shared/ClientTimeAgo"
import toast from "react-hot-toast"

interface Reply {
  id: string
  message: string
  isStaff: boolean
  createdAt: string
  user: { id: string; name: string | null; username: string; image: string | null }
}

interface Ticket {
  id: string
  subject: string
  message: string
  category: string | null
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  userId: string
  _count?: { replies: number }
  replies?: Reply[]
  user: { id: string; name: string | null; username: string; image: string | null }
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("open")
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [showReply, setShowReply] = useState<string | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newSubject, setNewSubject] = useState("")
  const [newCategory, setNewCategory] = useState("Technical")
  const [newPriority, setNewPriority] = useState("medium")
  const [newMessage, setNewMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)

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

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchReplies = async (ticketId: string) => {
    try {
      setRepliesLoading(true)
      const res = await fetch(`/api/tickets/${ticketId}/replies`)
      if (!res.ok) throw new Error("Failed to fetch replies")
      const data = await res.json()
      setReplies(data.replies)
    } catch {
      toast.error("Failed to load replies")
    } finally {
      setRepliesLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error("Subject and message are required")
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, message: newMessage, category: newCategory, priority: newPriority }),
      })
      if (!res.ok) throw new Error("Failed to create ticket")
      toast.success("Ticket created!")
      setShowNewTicket(false)
      setNewSubject("")
      setNewCategory("Technical")
      setNewPriority("medium")
      setNewMessage("")
      fetchTickets()
    } catch {
      toast.error("Failed to create ticket")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowReply(ticket.id)
    fetchReplies(ticket.id)
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !showReply) return
    try {
      setReplySubmitting(true)
      const res = await fetch(`/api/tickets/${showReply}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      if (!res.ok) throw new Error("Failed to send reply")
      toast.success("Reply sent!")
      setReplyText("")
      fetchReplies(showReply)
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setReplySubmitting(false)
    }
  }

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      })
      if (!res.ok) throw new Error("Failed to close ticket")
      toast.success("Ticket closed!")
      setShowReply(null)
      setSelectedTicket(null)
      fetchTickets()
    } catch {
      toast.error("Failed to close ticket")
    }
  }

  const getReplyCount = (ticket: Ticket) => {
    if (ticket._count) return ticket._count.replies
    if (ticket.replies) return ticket.replies.length
    return 0
  }

  const filtered = activeTab === "all" ? tickets : tickets.filter((t) => t.status === activeTab)

  if (loading) {
    return (
      <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage customer support requests</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage customer support requests</p>
          </div>
        </div>
        <EmptyState title="Failed to load tickets" description={error} />
      </motion.div>
    )
  }

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage customer support requests</p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          New Ticket
        </Button>
      </div>

      <Tabs tabs={[
        { id: "open", label: "Open", count: tickets.filter((t) => t.status === "open").length },
        { id: "in_progress", label: "In Progress", count: tickets.filter((t) => t.status === "in_progress").length },
        { id: "closed", label: "Closed", count: tickets.filter((t) => t.status === "closed").length },
        { id: "all", label: "All", count: tickets.length },
      ]} activeTab={activeTab} onTabChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description={activeTab === "all" ? "You haven't created any tickets yet." : `No ${activeTab.replace("_", " ")} tickets.`}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card cursor-pointer"
              onClick={() => handleOpenTicket(ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar name={ticket.user?.name || ticket.user?.username} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{ticket.subject}</span>
                      <Badge variant={ticket.priority === "high" ? "danger" : ticket.priority === "medium" ? "warning" : "primary"}>{ticket.priority}</Badge>
                      <Badge variant={ticket.status === "open" ? "primary" : ticket.status === "in_progress" ? "warning" : "secondary"}>{ticket.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ticket.user?.name || ticket.user?.username}</span>
                      <span>{ticket.category}</span>
                      <span><ClientTimeAgo date={ticket.createdAt} /></span>
                      <span>{getReplyCount(ticket)} replies</span>
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Modal open={!!showReply} onClose={() => { setShowReply(null); setSelectedTicket(null) }} title={selectedTicket?.subject || "Ticket Reply"}>
        <div className="space-y-4">
          {selectedTicket && (
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <span className="font-medium">Status:</span> {selectedTicket.status.replace("_", " ")} &middot;
              <span className="font-medium ml-2">Priority:</span> {selectedTicket.priority} &middot;
              <span className="font-medium ml-2">Category:</span> {selectedTicket.category}
            </div>
          )}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
            {selectedTicket && (
              <div className="flex items-start gap-2">
                <Avatar name={selectedTicket.user?.name || selectedTicket.user?.username} size="sm" />
                <div className="bg-muted rounded-lg p-3 text-sm flex-1">
                  <div className="font-medium text-xs mb-1">{selectedTicket.user?.name || selectedTicket.user?.username}</div>
                  <p>{selectedTicket.message}</p>
                </div>
              </div>
            )}
            {repliesLoading ? (
              <div className="flex justify-center py-4"><Spinner className="h-5 w-5" /></div>
            ) : (
              replies.map((reply) => (
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
              ))
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reply</label>
            <textarea
              placeholder="Type your reply..."
              className="input-premium min-h-[100px] w-full"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSendReply} loading={replySubmitting}>Send Reply</Button>
            {selectedTicket?.status !== "closed" && (
              <Button variant="outline" onClick={() => handleCloseTicket(showReply!)}>Close Ticket</Button>
            )}
          </div>
        </div>
      </Modal>

      {/* New Ticket Modal */}
      <Modal open={showNewTicket} onClose={() => setShowNewTicket(false)} title="Create Ticket">
        <form className="space-y-4" onSubmit={handleCreateTicket}>
          <Input label="Subject" placeholder="Brief description of the issue" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select className="input-premium w-full" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option>Technical</option>
              <option>Billing</option>
              <option>Feature Request</option>
              <option>Account</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select className="input-premium w-full" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              placeholder="Describe your issue in detail..."
              className="input-premium min-h-[120px] w-full"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" loading={submitting}>Create Ticket</Button>
        </form>
      </Modal>
    </motion.div>
  )
}
