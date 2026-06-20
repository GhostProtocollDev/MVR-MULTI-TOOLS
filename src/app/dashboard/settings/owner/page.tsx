'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui"
import toast from "react-hot-toast"

export default function OwnerSettingsPage() {
  const [gracePeriod, setGracePeriod] = useState("7")

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage platform configuration</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Platform Name" defaultValue="GHOST License System" />
            <Input label="Support Email" type="email" defaultValue="support@ghostlicenses.com" />
            <Input label="Website URL" defaultValue="https://ghostlicenses.com" />
            <Button onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grace Period Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  label="Grace Period (days)"
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  min={0}
                  max={30}
                />
              </div>
              <div className="flex-1 pt-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-border" />
                  <span className="text-sm">Enable grace period</span>
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              When a license expires, users will have {gracePeriod} days to renew before access is permanently revoked.
            </p>
            <Button onClick={() => toast.success("Grace period updated!")}>Update</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "30 days before expiration", default: true },
                { label: "14 days before expiration", default: true },
                { label: "7 days before expiration", default: true },
                { label: "3 days before expiration", default: true },
                { label: "1 day before expiration", default: true },
                { label: "License expired", default: true },
                { label: "Renewal successful", default: true },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-sm">{item.label}</span>
                  <input type="checkbox" defaultChecked={item.default} className="rounded border-border" />
                </label>
              ))}
            </div>
            <Button onClick={() => toast.success("Email settings saved!")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable maintenance mode to prevent user access during updates.
            </p>
            <div className="flex items-center gap-2">
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                <span className="inline-block h-4 w-4 rounded-full bg-background translate-x-1 transition-transform" />
              </button>
              <span className="text-sm">Maintenance mode is disabled</span>
            </div>
            <Input label="Maintenance Message" placeholder="We're currently undergoing maintenance..." />
            <Button variant="danger" onClick={() => toast.success("Maintenance mode updated!")}>Toggle Maintenance</Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
