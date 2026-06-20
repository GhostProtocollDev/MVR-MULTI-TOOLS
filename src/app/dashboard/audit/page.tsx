'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, Badge, Input } from "@/components/ui"
import { formatDateTime } from "@/lib/utils"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/audit-log")
      .then((r) => r.json())
      .then((data) => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter((l) => {
    const matchesSearch = l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.username?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || l.action === filter
    return matchesSearch && matchesFilter
  })

  const actions = Array.from(new Set(logs.map((l) => l.action)))

  function getActionBadge(action: string) {
    if (!action) return "primary"
    const upper = action.toUpperCase()
    if (upper.includes("BAN") || upper.includes("DELETE") || upper.includes("REVOKE")) return "danger"
    if (upper.includes("CREATE") || upper.includes("LICENSE") || upper.includes("UNBAN")) return "success"
    if (upper.includes("UPDATE") || upper.includes("EDIT") || upper.includes("CHANGE")) return "warning"
    return "primary"
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
          <p className="text-muted-foreground mt-1">Security and compliance audit trail</p>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} entries</span>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-premium max-w-[200px]"
          >
            <option value="all">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Details</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td colSpan={5} className="p-4">
                      <div className="h-8 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No audit entries found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <Badge variant={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 max-w-md">
                      <span className="text-sm truncate block">{log.details || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold">
                          {log.user?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm">{log.user?.username || log.userId || "-"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                        {log.ip || "-"}
                      </code>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? formatDateTime(log.createdAt) : "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
