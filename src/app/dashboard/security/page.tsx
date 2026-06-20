'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui"
import toast from "react-hot-toast"

export default function SecurityPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage platform security</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { user: "admin@ghost.dev", ip: "192.168.1.1", device: "Chrome / Windows", time: "2 min ago", status: "success" },
                { user: "admin@ghost.dev", ip: "10.0.0.1", device: "Safari / macOS", time: "3 hours ago", status: "success" },
                { user: "john@example.com", ip: "203.0.113.5", device: "Firefox / Linux", time: "1 day ago", status: "failed" },
                { user: "unknown", ip: "198.51.100.2", device: "Unknown", time: "2 days ago", status: "blocked" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === "success" ? "bg-success" :
                      log.status === "failed" ? "bg-warning" : "bg-destructive"
                    }`} />
                    <div>
                      <div className="text-sm">{log.user}</div>
                      <div className="text-xs text-muted-foreground">{log.ip} - {log.device}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{log.time}</div>
                    <Badge variant={log.status === "success" ? "success" : log.status === "failed" ? "warning" : "danger"}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { endpoint: "/api/auth/login", limit: "5/min", current: "3", status: "normal" },
                { endpoint: "/api/licenses/activate", limit: "10/min", current: "7", status: "normal" },
                { endpoint: "/api/auth/register", limit: "3/min", current: "8", status: "warning" },
              ].map((rate, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs font-mono">{rate.endpoint}</code>
                    <Badge variant={rate.status === "normal" ? "success" : "warning"}>{rate.current}/{rate.limit}</Badge>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      rate.status === "normal" ? "bg-success" : "bg-warning"
                    }`} style={{ width: `${(parseInt(rate.current) / parseInt(rate.limit)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[
                { action: "License created", user: "admin@ghost.dev", ip: "192.168.1.1", time: "5 min ago" },
                { action: "Payment processed", user: "john@example.com", ip: "203.0.113.5", time: "1 hour ago" },
                { action: "User registered", user: "sarah@example.com", ip: "198.51.100.2", time: "3 hours ago" },
                { action: "Settings updated", user: "admin@ghost.dev", ip: "192.168.1.1", time: "6 hours ago" },
                { action: "Theme applied", user: "admin@ghost.dev", ip: "10.0.0.1", time: "1 day ago" },
              ].map((log, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm">{log.action}</td>
                  <td className="p-4 text-sm">{log.user}</td>
                  <td className="p-4 text-sm font-mono text-xs">{log.ip}</td>
                  <td className="p-4 text-sm text-muted-foreground">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
