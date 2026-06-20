'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { formatDate } from "@/lib/utils"

export default function AccountProfilePage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                JD
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs border-2 border-background hover:bg-primary/90 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-muted-foreground">john@example.com</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success">Verified</Badge>
                <Badge variant="primary">Professional Plan</Badge>
              </div>
            </div>
            <Button>Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Licenses", value: "3" },
          { label: "Total Spent", value: "$948" },
          { label: "Support Tickets", value: "2" },
          { label: "Downloads", value: "15" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Full Name", value: "John Doe" },
              { label: "Email", value: "john@example.com" },
              { label: "Member Since", value: formatDate(new Date(2025, 3, 1)) },
              { label: "Last Login", value: "2 hours ago" },
            ].map((info) => (
              <div key={info.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{info.label}</span>
                <span className="text-sm font-medium">{info.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "License activated", detail: "Professional Plan", time: "2 days ago" },
                { action: "Payment received", detail: "$79.00", time: "2 days ago" },
                { action: "Profile updated", detail: "Changed avatar", time: "1 week ago" },
                { action: "Password changed", detail: "Security update", time: "2 weeks ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.detail} - {activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
