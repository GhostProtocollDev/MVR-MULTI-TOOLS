'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui"
import { ClientTimeAgo } from "@/components/shared/ClientTimeAgo"
import toast from "react-hot-toast"

const myTickets = [
  { id: "1", subject: "License activation failed", status: "open", priority: "high", date: "2026-06-19T10:00:00Z", replies: 2 },
  { id: "2", subject: "How to upgrade my plan?", status: "closed", priority: "medium", date: "2026-06-12T10:00:00Z", replies: 4 },
]

export default function AccountSupportPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Get help from our team</p>
        </div>
        <Button onClick={() => toast.success("Ticket created!")}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          New Ticket
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "📖", label: "Knowledge Base", desc: "Browse articles" },
          { icon: "❓", label: "FAQ", desc: "Common questions" },
        ].map((link) => (
          <Card key={link.label} className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="pt-6 flex items-center gap-3">
              <span className="text-2xl">{link.icon}</span>
              <div>
                <div className="font-medium text-sm">{link.label}</div>
                <div className="text-xs text-muted-foreground">{link.desc}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {myTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{ticket.subject}</span>
                    <Badge variant={ticket.status === "open" ? "primary" : "secondary"}>{ticket.status}</Badge>
                    <Badge variant={ticket.priority === "high" ? "danger" : "warning"}>{ticket.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span><ClientTimeAgo date={ticket.date} /></span>
                    <span>{ticket.replies} replies</span>
                  </div>
                </div>
                <button className="text-sm text-primary hover:underline">View</button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "How to activate your license key",
              "Understanding license expiration and renewal",
              "How to change your plan",
              "Setting up auto-renewal",
              "Troubleshooting activation issues",
            ].map((article) => (
              <a key={article} href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                → {article}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
