'use client'

import { motion } from "framer-motion"
import { Card, CardContent, Button, Badge } from "@/components/ui"
import { formatDate } from "@/lib/utils"

const changelogs = [
  { version: "2.0.0", title: "Major UI Overhaul", content: "Complete redesign of the dashboard with new theme system, improved performance, and enhanced user experience.", type: "feature", date: new Date(2026, 5, 15) },
  { version: "1.9.0", title: "API Access & Integrations", content: "Added REST API for license management, webhook support, and integration with popular payment gateways.", type: "feature", date: new Date(2026, 4, 20) },
  { version: "1.8.2", title: "Performance Improvements", content: "Optimized database queries, improved caching, and reduced page load times by 40%.", type: "improvement", date: new Date(2026, 3, 10) },
  { version: "1.8.1", title: "Bug Fixes", content: "Fixed license activation timeout, corrected billing date calculations, and resolved theme editor issues.", type: "fix", date: new Date(2026, 2, 25) },
  { version: "1.8.0", title: "Affiliate System Launch", content: "New affiliate/referral system with tracking, payouts, and analytics.", type: "feature", date: new Date(2026, 2, 1) },
  { version: "1.7.0", title: "Security Enhancements", content: "Two-factor authentication, improved session management, login activity monitoring, and audit logs.", type: "security", date: new Date(2026, 1, 10) },
]

export default function ChangelogPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          <p className="text-muted-foreground mt-1">Track all updates and improvements</p>
        </div>
        <Button>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          New Release
        </Button>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-8">
          {changelogs.map((log, i) => (
            <motion.div
              key={log.version}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative pl-20"
            >
              <div className="absolute left-4 top-1 w-9 h-9 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                {log.type === "feature" ? "✨" : log.type === "fix" ? "🐛" : log.type === "security" ? "🔒" : "⚡"}
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">v{log.version}</code>
                        <Badge variant={
                          log.type === "feature" ? "primary" :
                          log.type === "fix" ? "warning" :
                          log.type === "security" ? "danger" : "success"
                        }>
                          {log.type}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mt-2">{log.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
