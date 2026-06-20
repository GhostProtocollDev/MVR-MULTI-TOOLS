'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { ROLES, LICENSE_DURATIONS, getDurationDays } from "@/types"
import toast from "react-hot-toast"

function generateKey(prefix?: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segment = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  if (prefix) {
    return `${prefix.toUpperCase()}-${segment()}-${segment()}`
  }
  return `${segment()}-${segment()}-${segment()}-${segment()}`
}

export default function CreateLicensePage() {
  const [form, setForm] = useState({
    role: "user",
    duration: "1month",
    maxDevices: "3",
    status: "active",
    notes: "",
    assignedUser: "",
    customDate: "",
    prefix: "",
    format: "standard",
  })
  const [generated, setGenerated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const licenseKey = generateKey(form.prefix || undefined)
    const durationDays = getDurationDays(form.duration)

    try {
      const res = await fetch("/api/licenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          assignedRole: form.role,
          duration: form.duration,
          maxActivations: parseInt(form.maxDevices),
          status: form.status,
          notes: form.notes,
          assignedUser: form.assignedUser || undefined,
          customDate: form.customDate || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setGenerated(licenseKey)
      toast.success("License created successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create license")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create License</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate a new license key with custom configuration</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">License Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="standard">XXXX-XXXX-XXXX-XXXX</option>
                  <option value="prefixed">PRODUCT-XXXXXX-XXXXXX</option>
                </select>
              </div>
              {form.format === "prefixed" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Product Prefix</label>
                  <input
                    placeholder="GHOST"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                    className="input-premium w-full"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assigned Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-premium w-full"
                >
                  {ROLES.filter((r) => r.value !== "owner").map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Duration</label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="input-premium w-full"
                >
                  {LICENSE_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Max Devices</label>
                <input
                  type="number" min={1} max={999}
                  value={form.maxDevices}
                  onChange={(e) => setForm({ ...form, maxDevices: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Initial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assigned User (optional)</label>
                <input
                  placeholder="Username"
                  value={form.assignedUser}
                  onChange={(e) => setForm({ ...form, assignedUser: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Custom Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.customDate}
                  onChange={(e) => setForm({ ...form, customDate: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input-premium w-full h-24 resize-none"
                placeholder="Internal notes for this license..."
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 5 2 7L12 16l-4.5 3 2-7L4 9h7z" /></svg>
                  Generate License
                </span>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-sm font-semibold mb-4">Preview</h3>
            {generated ? (
              <div className="space-y-4">
                <div className="text-center p-6 rounded-xl" style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                  <div className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">License Key</div>
                  <div className="font-mono text-lg font-bold tracking-wider text-primary break-all">{generated}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Role</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                      {ROLES.find(r => r.value === form.role)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{LICENSE_DURATIONS.find(d => d.value === form.duration)?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Devices</span>
                    <span className="font-medium">{form.maxDevices}</span>
                  </div>
                  {form.notes && (
                    <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      {form.notes}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(generated); toast.success("Copied!") }}
                  className="w-full h-10 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  Copy License Key
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3 7h7l-5.5 5 2 7L12 16l-4.5 3 2-7L4 9h7z" />
                </svg>
                <p className="text-sm">Configure and generate a license to see the preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
