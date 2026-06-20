'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

const backups = [
  { id: "1", name: "Full Backup - Jun 19, 2026", size: "256 MB", type: "automatic", status: "completed", date: "2026-06-19T10:00:00Z" },
  { id: "2", name: "Full Backup - Jun 18, 2026", size: "251 MB", type: "automatic", status: "completed", date: "2026-06-18T10:00:00Z" },
  { id: "3", name: "Pre-Update Backup", size: "248 MB", type: "manual", status: "completed", date: "2026-06-17T10:00:00Z" },
  { id: "4", name: "Weekly Full Backup", size: "245 MB", type: "automatic", status: "completed", date: "2026-06-12T10:00:00Z" },
]

export default function BackupPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup & Recovery</h1>
          <p className="text-muted-foreground mt-1">Manage system backups and data recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.success("Auto-backup configured!")}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4"/></svg>
            Schedule
          </Button>
          <Button onClick={() => toast.success("Backup started!")}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Backup Now
          </Button>
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Backups", value: "24" },
          { label: "Last Backup", value: "2 hours ago" },
          { label: "Total Size", value: "6.2 GB" },
          { label: "Auto-backup", value: "Daily" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Size</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{b.name}</td>
                  <td className="p-4 text-sm">{b.size}</td>
                  <td className="p-4">
                    <Badge variant={b.type === "automatic" ? "primary" : "secondary"}>{b.type}</Badge>
                  </td>
                  <td className="p-4"><Badge variant="success">Completed</Badge></td>
                  <td className="p-4 text-sm text-muted-foreground">{formatDate(b.date)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Restore</Button>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
