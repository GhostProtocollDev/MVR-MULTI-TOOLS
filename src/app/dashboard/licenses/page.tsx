'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, Badge, Input, Button } from "@/components/ui"
import { formatDate, daysUntil } from "@/lib/utils"
import toast from "react-hot-toast"

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  useEffect(() => {
    fetchLicenses()
  }, [])

  async function fetchLicenses() {
    try {
      const res = await fetch("/api/owner/licenses")
      const data = await res.json()
      setLicenses(data.licenses || [])
    } catch {
      toast.error("Failed to load licenses")
    } finally {
      setLoading(false)
    }
  }

  const filtered = licenses.filter((l) => {
    const q = search.toLowerCase()
    return l.licenseKey?.toLowerCase().includes(q) ||
      l.user?.username?.toLowerCase().includes(q) ||
      l.user?.email?.toLowerCase().includes(q) ||
      l.plan?.name?.toLowerCase().includes(q)
  })

  async function handleRevoke(licenseId: string) {
    setRevokingId(licenseId)
    try {
      const res = await fetch("/api/owner/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", licenseId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("License revoked")
      setLicenses(licenses.map((l) => l.id === licenseId ? { ...l, status: "expired" } : l))
    } catch {
      toast.error("Failed to revoke license")
    } finally {
      setRevokingId(null)
      setConfirmRevoke(null)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "success"
      case "expired": return "danger"
      case "pending": return "warning"
      default: return "primary"
    }
  }

  function getExpiryText(license: any) {
    if (license.isLifetime) return "Lifetime"
    const days = daysUntil(license.expiresAt)
    if (days < 0) return "Expired"
    if (days <= 7) return `${days} days (soon)`
    return `${days} days`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licencias</h1>
          <p className="text-muted-foreground mt-1">Manage all license keys</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-success">{licenses.filter((l) => l.status === "active").length} active</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{licenses.length} total</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search licenses, users, plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Licencia</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario asignado</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha creación</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Owner creador</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td colSpan={7} className="p-4">
                      <div className="h-8 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No licenses found
                  </td>
                </tr>
              ) : (
                filtered.map((license) => (
                  <tr key={license.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded text-xs">
                        {license.licenseKey || license.key}
                      </code>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(license.status)}>
                        {license.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm font-medium">{license.user?.name || license.user?.username || "Unassigned"}</div>
                        <div className="text-xs text-muted-foreground">{license.user?.email || ""}</div>
                      </div>
                      {license.isLifetime && (
                        <span className="text-[10px] font-bold text-yellow-400">LIFETIME</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{license.plan?.name || license.assignedRole || "Standard"}</td>
                    <td className="p-4">
                      <div className="text-sm">{formatDate(license.createdAt)}</div>
                      <div className={`text-xs ${getExpiryText(license).startsWith("Expired") ? "text-destructive" : getExpiryText(license).includes("soon") ? "text-warning" : "text-muted-foreground"}`}>
                        {getExpiryText(license)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{license.createdBy || license.user?.username || "System"}</td>
                    <td className="p-4 text-right">
                      {license.status === "active" && (
                        <button
                          onClick={() => setConfirmRevoke(license.id)}
                          disabled={revokingId === license.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {revokingId === license.id ? "Revoking..." : "Revocar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {confirmRevoke && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmRevoke(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-sm mx-4"
              >
                <div className="glass-card rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Revoke License</h3>
                      <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmRevoke(null)}
                      className="flex-1 h-10 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRevoke(confirmRevoke)}
                      className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
