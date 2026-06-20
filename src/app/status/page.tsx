'use client'

import { motion } from "framer-motion"
import { Badge } from "@/components/ui"

const services = [
  { name: "API", status: "operational", uptime: "99.99%", latency: "45ms" },
  { name: "License Activation", status: "operational", uptime: "99.95%", latency: "120ms" },
  { name: "Dashboard", status: "operational", uptime: "99.98%", latency: "230ms" },
  { name: "Payment Processing", status: "operational", uptime: "99.99%", latency: "890ms" },
  { name: "Email Service", status: "operational", uptime: "99.90%", latency: "1.2s" },
  { name: "Database", status: "operational", uptime: "100%", latency: "12ms" },
]

const incidents = [
  { date: "Jun 15, 2026", title: "Scheduled Maintenance", status: "resolved", desc: "Planned database upgrade completed successfully." },
  { date: "Jun 10, 2026", title: "API Latency Issue", status: "resolved", desc: "Brief latency spike resolved after cache optimization." },
  { date: "May 28, 2026", title: "Email Delivery Delay", status: "resolved", desc: "Email queue backlog cleared. All messages delivered." },
]

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational")

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${allOperational ? "bg-success/10" : "bg-warning/10"}`}>
            {allOperational ? (
              <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ) : (
              <svg className="w-8 h-8 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}</h1>
          <p className="text-muted-foreground">Last checked: 2 minutes ago</p>
        </motion.div>

        {/* Service Status */}
        <div className="space-y-3 mb-12">
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="premium-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${service.status === "operational" ? "bg-success" : service.status === "degraded" ? "bg-warning" : "bg-destructive"}`} />
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-muted-foreground">{service.uptime} uptime</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={service.status === "operational" ? "success" : "warning"}>
                    {service.status === "operational" ? "Operational" : "Degraded"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">{service.latency}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Incidents</h2>
          <div className="space-y-3">
            {incidents.map((incident, i) => (
              <motion.div
                key={incident.title}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="premium-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{incident.title}</span>
                      <Badge variant={incident.status === "resolved" ? "success" : "warning"}>
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{incident.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subscribe */}
        <div className="mt-12 p-6 rounded-2xl glass-card text-center">
          <h3 className="font-semibold mb-2">Get Notified</h3>
          <p className="text-sm text-muted-foreground mb-4">Subscribe to receive status updates via email</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com" className="input-premium flex-1" />
            <button className="btn-primary">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  )
}
