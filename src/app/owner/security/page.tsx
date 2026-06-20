'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"

export default function OwnerSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Controls</h1>
        <p className="text-zinc-400 text-sm mt-1">Owner-level security and license management</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Owner License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">Current License Key</div>
              <code className="text-sm font-mono text-red-400">GHOST-****-****-****-****</code>
            </div>
            <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm" onClick={() => alert("License rotation initiated. Check audit log.")}>
              Rotate License Key
            </Button>
            <Button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm border border-red-500/20">
              Replace License Key
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Emergency Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button className="w-full bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 text-sm border border-yellow-500/20">
                Initiate Emergency Recovery
              </Button>
              <Button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm border border-red-500/20">
                Force Logout All Sessions
              </Button>
              <Button className="w-full bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-sm border border-orange-500/20">
                Lock Owner Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Login Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {[
              { ip: "192.168.1.1", device: "Chrome / Windows", location: "New York, US", time: "2 min ago", status: "success" },
              { ip: "10.0.0.1", device: "Firefox / Linux", location: "San Francisco, US", time: "1 day ago", status: "success" },
              { ip: "203.0.113.5", device: "Unknown / Unknown", location: "Moscow, RU", time: "3 days ago", status: "blocked" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <div className="text-sm text-zinc-300">
                      <span className="font-mono text-xs">{log.ip}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{log.device} - {log.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">{log.time}</div>
                  <Badge variant={log.status === "success" ? "success" : "danger"}>{log.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
