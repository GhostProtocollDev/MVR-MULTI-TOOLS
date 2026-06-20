'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store"
import { generateLicenseKey } from "@/lib/utils"
import toast from "react-hot-toast"

export default function CreateLicenseModal() {
  const { showCreateLicense, setShowCreateLicense } = useAppStore()
  const [plan, setPlan] = useState("professional")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [assignedUser, setAssignedUser] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (showCreateLicense) {
      setLicenseKey(generateLicenseKey())
      setCreatedBy("")
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((d) => setCreatedBy(d.user?.username || "Owner"))
        .catch(() => setCreatedBy("Owner"))
    }
  }, [showCreateLicense])

  const handleGenerate = () => {
    setLicenseKey(generateLicenseKey())
    setCopied(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(licenseKey)
    setCopied(true)
    toast.success("License key copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreate = async () => {
    if (!plan || !licenseKey) {
      toast.error("Please fill in all required fields")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/licenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          assignedRole: plan,
          duration: expiryDate ? "custom" : "12months",
          notes,
          assignedUser: assignedUser || undefined,
          customDate: expiryDate || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create license")
      toast.success("License created successfully!")
      setShowCreateLicense(false)
      setPlan("professional")
      setExpiryDate("")
      setNotes("")
      setAssignedUser("")
    } catch {
      toast.error("Failed to create license")
    } finally {
      setCreating(false)
    }
  }

  const planOptions = [
    { value: "starter", label: "Starter", price: "$9/mo" },
    { value: "professional", label: "Professional", price: "$29/mo" },
    { value: "enterprise", label: "Enterprise", price: "$99/mo" },
    { value: "lifetime", label: "Lifetime", price: "$499 one-time" },
  ]

  return (
    <AnimatePresence>
      {showCreateLicense && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateLicense(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="pointer-events-auto w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card rounded-2xl p-6 shadow-2xl border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Create License</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Generate a new license key</p>
                  </div>
                  <button
                    onClick={() => setShowCreateLicense(false)}
                    className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Plan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {planOptions.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPlan(p.value)}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                            plan === p.value
                              ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10"
                              : "border-border/50 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="text-sm font-semibold">{p.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{p.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                      Expiration Date <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="datetime-local"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="input-premium w-full pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                      Assigned User <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={assignedUser}
                      onChange={(e) => setAssignedUser(e.target.value)}
                      placeholder="Username or email..."
                      className="input-premium w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">License Key</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <code className="block w-full input-premium font-mono text-sm bg-muted/30 pr-10 truncate">
                          {licenseKey}
                        </code>
                        {copied && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-success">Copied!</span>
                        )}
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                        title="Generate new key"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCopy}
                        className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                      Notes <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this license..."
                      rows={3}
                      className="input-premium w-full resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateLicense(false)}
                      className="flex-1 h-11 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {creating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        "Create License"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
