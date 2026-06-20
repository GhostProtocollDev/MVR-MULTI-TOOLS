'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatDateTime } from "@/lib/utils"

export default function OwnerAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState("")

  useEffect(() => {
    const url = filter ? `/api/owner/audit-log?action=${filter}` : "/api/owner/audit-log"
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch(() => {})
  }, [filter])

  const actions = ["ALL", "LOGIN_SUCCESS", "LOGIN_FAILED", "LICENSE_ROTATED", "LICENSE_REPLACED", "SESSION_TERMINATED", "RECOVERY_REQUESTED", "PLAN_UPDATED", "THEME_PUBLISHED", "ANNOUNCEMENT_SENT"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
        <p className="text-zinc-400 text-sm mt-1">Complete owner action history - immutable record</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a === "ALL" ? "" : a)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              (a === "ALL" && !filter) || filter === a
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded mt-0.5 shrink-0">
                      {log.action}
                    </span>
                    <div>
                      <p className="text-sm text-zinc-300">{log.details || "No details"}</p>
                      <div className="text-xs text-zinc-600 mt-1">
                        IP: {log.ip || "unknown"} | UA: {log.userAgent ? log.userAgent.substring(0, 50) + "..." : "unknown"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{formatDateTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">No audit log entries found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
