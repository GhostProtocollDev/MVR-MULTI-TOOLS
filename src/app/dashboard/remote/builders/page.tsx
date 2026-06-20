'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, Badge, Button, Input } from "@/components/ui"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import BuildExeModal from "@/components/dashboard/BuildExeModal"
import { getFlagEmoji } from "@/lib/geo"

export default function BuildersPage() {
  const [builders, setBuilders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [buildExeFor, setBuildExeFor] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/remote/builders")
      .then((r) => r.json())
      .then((data) => setBuilders(data.builders || []))
      .catch(() => toast.error("Failed to load builders"))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(builderId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/remote/builders/${builderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error("Failed")
      setBuilders(builders.map((b) => b.id === builderId ? { ...b, isActive: !isActive } : b))
      toast.success(isActive ? "Builder deactivated" : "Builder activated")
    } catch {
      toast.error("Failed to update builder")
    }
  }

  async function handleRegenerate(builderId: string) {
    setRegenerating(builderId)
    try {
      const res = await fetch(`/api/remote/builders/${builderId}/regenerate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setBuilders(builders.map((b) => b.id === builderId ? { ...b, ...data.builder } : b))
      toast.success("Certificate regenerated")
    } catch {
      toast.error("Failed to regenerate")
    } finally {
      setRegenerating(null)
    }
  }

  async function handleDelete(builderId: string) {
    try {
      const res = await fetch(`/api/remote/builders/${builderId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setBuilders(builders.filter((b) => b.id !== builderId))
      toast.success("Builder deleted")
    } catch {
      toast.error("Failed to delete builder")
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Builders</h1>
          <p className="text-muted-foreground mt-1">Manage builder instances and certificates</p>
        </div>
        <Button onClick={() => router.push("/dashboard/remote/builders/create")}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          Create Builder
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : builders.length === 0 ? (
        <Card className="p-12 text-center">
          <span className="text-5xl block mb-4">🔨</span>
          <h3 className="text-lg font-semibold mb-2">No Builders Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first builder to start deploying remote clients</p>
          <Button onClick={() => router.push("/dashboard/remote/builders/create")}>Create Builder</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {builders.map((builder) => {
            const cert = builder.certificate ? JSON.parse(builder.certificate) : null

              return (
                <div key={builder.id} className="premium-card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {builder.country && <span className="text-xl mr-1" title={builder.country}>{getFlagEmoji(builder.country)}</span>}
                        <h3 className="text-lg font-semibold">{builder.name}</h3>
                      <Badge variant={builder.isActive ? "success" : "danger"}>
                        {builder.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {builder.description && (
                      <p className="text-sm text-muted-foreground mt-1">{builder.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setBuildExeFor(builder)}
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Build EXE
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate(builder.id)}
                      disabled={regenerating === builder.id}
                    >
                      {regenerating === builder.id ? "Regenerating..." : "Regen Cert"}
                    </Button>
                    <Button
                      variant={builder.isActive ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleToggle(builder.id, builder.isActive)}
                    >
                      {builder.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <button
                      onClick={() => setConfirmDelete(builder.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">UUID</span>
                    <code className="text-xs font-mono">{builder.uuid}</code>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Fingerprint</span>
                    <code className="text-xs font-mono">{builder.fingerprint?.slice(0, 32)}...</code>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Clients</span>
                    <span className="text-lg font-bold">{builder._count?.clients || 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Certificate</span>
                    <span className="text-sm font-medium">{cert ? new Date(cert.issuedAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>

                {builder.allowedDomains && (
                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground block mb-1">Allowed Domains</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {builder.allowedDomains.split(",").map((d: string) => (
                        <span key={d} className="text-xs bg-muted/50 px-2 py-0.5 rounded font-mono">{d.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
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
                      <h3 className="font-semibold">Delete Builder</h3>
                      <p className="text-sm text-muted-foreground">All associated clients will be orphaned</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 h-10 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium">Cancel</button>
                    <button onClick={() => handleDelete(confirmDelete)} className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all">Delete</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <BuildExeModal open={!!buildExeFor} onClose={() => setBuildExeFor(null)} builder={buildExeFor} />
    </motion.div>
  )
}
