'use client'

import { motion } from "framer-motion"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import { ClientTimeAgo } from "@/components/shared/ClientTimeAgo"
import toast from "react-hot-toast"

const notifications = [
  { id: "1", title: "License Expiring Soon", message: "Your Professional license will expire in 7 days.", type: "warning", read: false, date: "2026-06-19T10:00:00Z" },
  { id: "2", title: "Payment Successful", message: "Your renewal payment of $79.00 has been processed.", type: "success", read: false, date: "2026-06-18T10:00:00Z" },
  { id: "3", title: "New Feature Available", message: "API access is now available on your plan.", type: "info", read: true, date: "2026-06-17T10:00:00Z" },
  { id: "4", title: "License Activated", message: "Your license has been activated on a new device.", type: "info", read: true, date: "2026-06-12T10:00:00Z" },
]

export default function AccountNotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={() => toast.success("All marked as read")}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={`cursor-pointer transition-all ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    n.type === "warning" ? "bg-warning/10" :
                    n.type === "success" ? "bg-success/10" : "bg-primary/10"
                  }`}>
                    {n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "ℹ️"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 block"><ClientTimeAgo date={n.date} /></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
