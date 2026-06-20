'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { formatCurrency, formatDate } from "@/lib/utils"

const payments = [
  { id: "1", date: new Date(2026, 5, 1), amount: 79, plan: "Professional", method: "Credit Card", status: "paid", invoice: "#INV-001" },
  { id: "2", date: new Date(2026, 4, 1), amount: 79, plan: "Professional", method: "Credit Card", status: "paid", invoice: "#INV-002" },
  { id: "3", date: new Date(2026, 3, 1), amount: 79, plan: "Professional", method: "Credit Card", status: "paid", invoice: "#INV-003" },
  { id: "4", date: new Date(2026, 2, 1), amount: 49, plan: "Starter", method: "PayPal", status: "paid", invoice: "#INV-004" },
  { id: "5", date: new Date(2026, 1, 1), amount: 49, plan: "Starter", method: "PayPal", status: "paid", invoice: "#INV-005" },
]

export default function AccountBillingPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing History</h1>
        <p className="text-muted-foreground text-sm">View your payment history and invoices</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
              <div className="text-xl font-bold">Professional</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(79)}/month</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Change Plan</Button>
              <Button variant="danger">Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
              <div>
                <div className="text-sm font-medium">Visa ending in 4242</div>
                <div className="text-xs text-muted-foreground">Expires 12/28</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm">{p.invoice}</td>
                    <td className="p-4 text-sm">{formatDate(p.date)}</td>
                    <td className="p-4 text-sm">{p.plan}</td>
                    <td className="p-4 text-sm font-medium">{formatCurrency(p.amount)}</td>
                    <td className="p-4 text-sm">{p.method}</td>
                    <td className="p-4"><Badge variant="success">Paid</Badge></td>
                    <td className="p-4">
                      <button className="text-sm text-primary hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
