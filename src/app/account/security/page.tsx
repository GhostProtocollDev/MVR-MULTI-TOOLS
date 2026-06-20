'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

export default function AccountSecurityPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Current Password" type="password" placeholder="Enter current password" />
          <Input label="New Password" type="password" placeholder="Enter new password" />
          <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
          <Button onClick={() => toast.success("Password updated!")}>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-factor authentication</div>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
            <Button variant="outline" onClick={() => toast.success("2FA setup initiated!")}>Enable</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { device: "Chrome on Windows", ip: "192.168.1.1", time: "2 hours ago", location: "New York, US" },
              { device: "Safari on macOS", ip: "10.0.0.1", time: "3 days ago", location: "San Francisco, US" },
              { device: "Firefox on Linux", ip: "203.0.113.5", time: "1 week ago", location: "London, UK" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-medium">{log.device}</div>
                  <div className="text-xs text-muted-foreground">{log.ip} - {log.location}</div>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Personal Laptop", type: "Windows", lastUsed: "2 hours ago", trusted: true },
              { name: "Work Desktop", type: "Linux", lastUsed: "3 days ago", trusted: true },
              { name: "Unknown Device", type: "Unknown", lastUsed: "2 weeks ago", trusted: false },
            ].map((device, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{device.type === "Windows" ? "🪟" : device.type === "Linux" ? "🐧" : "❓"}</div>
                  <div>
                    <div className="text-sm font-medium">{device.name}</div>
                    <div className="text-xs text-muted-foreground">{device.type} - Last used {device.lastUsed}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={device.trusted ? "success" : "warning"}>{device.trusted ? "Trusted" : "Unknown"}</Badge>
                  {!device.trusted && <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
