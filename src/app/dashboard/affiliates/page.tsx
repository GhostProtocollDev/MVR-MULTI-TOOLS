'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

const referrals = [
  { id: "1", email: "friend1@example.com", status: "converted", reward: 29, date: "Jun 15, 2026" },
  { id: "2", email: "friend2@example.com", status: "pending", reward: null, date: "Jun 18, 2026" },
  { id: "3", email: "friend3@example.com", status: "converted", reward: 29, date: "Jun 10, 2026" },
]

export default function AffiliatesPage() {
  const referralCode = "GHOST-JOHN-2026"

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
        <p className="text-muted-foreground mt-1">Manage your referral program</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: "45" },
          { label: "Converted", value: "28" },
          { label: "Pending", value: "17" },
          { label: "Total Earned", value: formatCurrency(812) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={`https://ghostlicenses.com/ref/${referralCode}`} readOnly className="flex-1" />
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`https://ghostlicenses.com/ref/${referralCode}`); toast.success("Copied!") }}>
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this link with friends. You earn $29 for each successful referral!
          </p>
        </CardContent>
      </Card>

      {/* Referral Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reward</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm">{r.email}</td>
                  <td className="p-4">
                    <Badge variant={r.status === "converted" ? "success" : "warning"}>{r.status}</Badge>
                  </td>
                  <td className="p-4 text-sm">{r.reward ? formatCurrency(r.reward) : "-"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
