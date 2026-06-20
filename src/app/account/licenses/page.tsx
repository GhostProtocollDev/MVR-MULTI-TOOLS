'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { formatDate, daysUntil } from "@/lib/utils"

const myLicenses = [
  { id: "1", key: "ABCD-EFGH-IJKL-MNOP", plan: "Professional", status: "active", purchased: "2025-07-01T00:00:00Z", expires: "2027-06-15T00:00:00Z", activations: 2, maxActivations: 3, autoRenew: true },
  { id: "2", key: "WXYZ-ABCD-EFGH-IJKL", plan: "Professional", status: "active", purchased: "2025-10-10T00:00:00Z", expires: "2027-09-10T00:00:00Z", activations: 1, maxActivations: 3, autoRenew: false },
  { id: "3", key: "QRST-UVWX-YZAB-CDEF", plan: "Starter", status: "expired", purchased: "2024-04-01T00:00:00Z", expires: "2025-03-01T00:00:00Z", activations: 0, maxActivations: 1, autoRenew: false },
]

export default function AccountLicensesPage() {
  const [expiryDays, setExpiryDays] = useState<Record<string, number>>({})

  useEffect(() => {
    const days: Record<string, number> = {}
    for (const lic of myLicenses) {
      days[lic.id] = daysUntil(lic.expires)
    }
    setExpiryDays(days)
  }, [])

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Licenses</h1>
          <p className="text-muted-foreground text-sm">Manage your license keys</p>
        </div>
        <Button>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          Purchase New
        </Button>
      </div>

      <div className="space-y-4">
        {myLicenses.map((license) => (
          <Card key={license.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={license.status === "active" ? "success" : "danger"}>{license.status}</Badge>
                    <span className="text-lg font-bold">{license.plan}</span>
                  </div>
                  <code className="block text-sm font-mono bg-muted px-3 py-1.5 rounded-lg">{license.key}</code>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Purchased: {formatDate(license.purchased)}</span>
                    <span>Expires: {formatDate(license.expires)}</span>
                    {license.status === "active" && expiryDays[license.id] !== undefined && (
                      <span className={expiryDays[license.id] < 7 ? "text-warning font-medium" : ""}>
                        {expiryDays[license.id]} days remaining
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {license.status === "active" && (
                    <>
                      <Button variant="outline" size="sm">Manage</Button>
                      <Button size="sm">Renew</Button>
                    </>
                  )}
                  {license.status === "expired" && (
                    <Button size="sm">Reactivate</Button>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activations: {license.activations}/{license.maxActivations}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={license.autoRenew} readOnly className="rounded border-border" />
                      <span className="text-muted-foreground">Auto-renew</span>
                    </label>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
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
