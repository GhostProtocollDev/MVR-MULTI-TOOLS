'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Modal } from "@/components/ui"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

const coupons = [
  { id: "1", code: "LAUNCH20", discount: "20%", type: "percentage", uses: 45, maxUses: 100, status: "active", expires: "2026-09-01T00:00:00Z" },
  { id: "2", code: "SAVE50", discount: "$50", type: "fixed", uses: 12, maxUses: 50, status: "active", expires: "2026-07-15T00:00:00Z" },
  { id: "3", code: "WELCOME10", discount: "10%", type: "percentage", uses: 89, maxUses: null, status: "active", expires: null },
]

export default function CouponsPage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Manage promotional coupons and discounts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Code</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Discount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usage</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Max Uses</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expires</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4"><code className="text-sm font-mono bg-muted px-2 py-1 rounded text-xs">{c.code}</code></td>
                  <td className="p-4 text-sm font-medium">{c.discount}</td>
                  <td className="p-4 text-sm">{c.uses}</td>
                  <td className="p-4 text-sm">{c.maxUses || "∞"}</td>
                  <td className="p-4"><Badge variant="success">Active</Badge></td>
                  <td className="p-4 text-sm">{c.expires ? formatDate(c.expires) : "Never"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Coupon">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Coupon created!"); setShowCreate(false) }}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Coupon Code" placeholder="e.g. SUMMER20" required />
            <Input label="Discount Value" type="number" placeholder="20" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount Type</label>
            <select className="input-premium w-full">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Uses" type="number" placeholder="Leave empty for unlimited" />
            <Input label="Min. Purchase" type="number" placeholder="0" />
          </div>
          <Input label="Expiration Date" type="date" />
          <Button type="submit" className="w-full">Create Coupon</Button>
        </form>
      </Modal>
    </motion.div>
  )
}
