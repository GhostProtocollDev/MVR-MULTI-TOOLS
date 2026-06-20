'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Avatar, Tabs } from "@/components/ui"
import { formatDate } from "@/lib/utils"

const customers = [
  { id: "1", name: "John Smith", email: "john@example.com", plan: "Professional", status: "active", joined: "2025-04-01T00:00:00Z", revenue: 948, licenses: 3, lastLogin: "2026-06-19T10:00:00Z" },
  { id: "2", name: "Sarah Johnson", email: "sarah@example.com", plan: "Enterprise", status: "active", joined: "2025-02-15T00:00:00Z", revenue: 2388, licenses: 2, lastLogin: "2026-06-18T10:00:00Z" },
  { id: "3", name: "Mike Wilson", email: "mike@example.com", plan: "Starter", status: "expired", joined: "2024-07-20T00:00:00Z", revenue: 348, licenses: 1, lastLogin: "2026-06-12T10:00:00Z" },
  { id: "4", name: "Alice Brown", email: "alice@example.com", plan: "Professional", status: "active", joined: "2025-06-10T00:00:00Z", revenue: 474, licenses: 1, lastLogin: "2026-06-17T10:00:00Z" },
  { id: "5", name: "David Lee", email: "david@example.com", plan: "Starter", status: "active", joined: "2025-09-05T00:00:00Z", revenue: 87, licenses: 1, lastLogin: "2026-06-19T09:00:00Z" },
  { id: "6", name: "Emma Davis", email: "emma@example.com", plan: "Enterprise", status: "active", joined: "2025-03-01T00:00:00Z", revenue: 1592, licenses: 4, lastLogin: "2026-06-19T10:00:00Z" },
]

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filtered = customers.filter((c) => {
    const match = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    if (activeTab === "all") return match
    return match && c.status === activeTab
  })

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">Manage your customer base</p>
        </div>
        <Button>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          Invite Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs tabs={[
          { id: "all", label: "All", count: customers.length },
          { id: "active", label: "Active", count: customers.filter((c) => c.status === "active").length },
          { id: "expired", label: "Expired", count: customers.filter((c) => c.status === "expired").length },
        ]} activeTab={activeTab} onTabChange={setActiveTab} />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="premium-card"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size="md" />
                <div>
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">{customer.email}</div>
                </div>
              </div>
              <Badge variant={customer.status === "active" ? "success" : "danger"}>{customer.status}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm py-3 border-y border-border/50">
              <div>
                <div className="font-semibold">{formatCurrency(customer.revenue)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div>
                <div className="font-semibold">{customer.licenses}</div>
                <div className="text-xs text-muted-foreground">Licenses</div>
              </div>
              <div>
                <div className="font-semibold">{customer.plan}</div>
                <div className="text-xs text-muted-foreground">Plan</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Joined {formatDate(customer.joined)}</span>
              <span>Last login {formatDate(customer.lastLogin)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function formatCurrency(amount: number) {
  return `$${amount}`
}
