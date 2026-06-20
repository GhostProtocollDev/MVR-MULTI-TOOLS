'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Modal } from "@/components/ui"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

const announcements = [
  { id: "1", title: "System Maintenance", content: "Scheduled maintenance on June 20th, 2:00 AM - 4:00 AM EST", type: "warning", status: "active", date: "2026-06-19T10:00:00Z", audience: "All Users" },
  { id: "2", title: "New Feature: API Access", content: "We've launched API access for Professional and Enterprise plans.", type: "info", status: "active", date: "2026-06-18T10:00:00Z", audience: "All Users" },
  { id: "3", title: "Price Update", content: "Starting July 1st, our Enterprise plan will be updated.", type: "info", status: "draft", date: "2026-06-17T10:00:00Z", audience: "Enterprise" },
]

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to your customers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    a.type === "warning" ? "bg-warning/10" : "bg-primary/10"
                  }`}>
                    {a.type === "warning" ? "⚠️" : "📢"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge variant={a.status === "active" ? "success" : "secondary"}>{a.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(a.date)}</span>
                      <span>Target: {a.audience}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Announcement">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Announcement published!"); setShowCreate(false) }}>
          <Input label="Title" placeholder="Announcement title" required />
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea placeholder="Write your announcement..." className="input-premium min-h-[120px] w-full" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select className="input-premium w-full">
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audience</label>
              <select className="input-premium w-full">
                <option>All Users</option>
                <option>Active Customers</option>
                <option>Expired Customers</option>
                <option>Specific Plan</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sendEmail" className="rounded border-border" />
            <label htmlFor="sendEmail" className="text-sm">Also send email notification</label>
          </div>
          <Button type="submit" className="w-full">Publish Announcement</Button>
        </form>
      </Modal>
    </motion.div>
  )
}
