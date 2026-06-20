'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from "@/components/ui"
import { formatDateTime } from "@/lib/utils"

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/owner/audit-log")
      .then((r) => r.json())
      .then((data) => setLogs(data.logs || []))
      .catch(() => {})
  }, [])

  const filtered = logs.filter((l) =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-1">Complete audit trail of all system actions</p>
      </div>

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <td colSpan={4} className="p-4 text-center text-muted-foreground py-8">
                  No logs found
                </td>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="primary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{log.details || "-"}</TableCell>
                  <TableCell>{log.user?.username || log.userId || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.createdAt ? formatDateTime(log.createdAt) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  )
}
