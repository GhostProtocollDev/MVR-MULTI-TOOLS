'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { formatDateTime } from "@/lib/utils"

export default function OwnerSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])

  const fetchSessions = () => {
    fetch("/api/owner/sessions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
  }

  useEffect(() => { fetchSessions() }, [])

  const terminateSession = async (sessionId: string) => {
    await fetch(`/api/owner/sessions?sessionId=${sessionId}`, { method: "DELETE", credentials: "include" })
    fetchSessions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
          <p className="text-zinc-400 text-sm mt-1">{sessions.filter((s) => s.isActive).length} active session(s)</p>
        </div>
        <Button
          className="bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm border border-red-500/20"
          onClick={async () => {
            await fetch("/api/owner/sessions?all=true", { method: "DELETE", credentials: "include" })
            window.location.href = "/owner"
          }}
        >
          Terminate All Others
        </Button>
      </div>

      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${session.isActive ? "bg-green-500" : "bg-zinc-600"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-300">{session.userAgent || "Unknown device"}</span>
                      <Badge variant={session.isActive ? "success" : "secondary"}>
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-500">
                      IP: {session.ip || "unknown"} | Last used: {session.lastUsed ? formatDateTime(session.lastUsed) : "never"}
                    </div>
                    <div className="text-xs text-zinc-600">
                      Created: {formatDateTime(session.createdAt)} | Expires: {formatDateTime(session.expiresAt)}
                    </div>
                  </div>
                </div>
                {session.isActive && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Terminate
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
