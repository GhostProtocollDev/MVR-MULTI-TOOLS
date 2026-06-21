"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui"
import toast from "react-hot-toast"

interface RenewLicenseModalProps {
  open: boolean
  onClose: () => void
  onRenewed: (data: any) => void
  currentLicense: any
}

export default function RenewLicenseModal({ open, onClose, onRenewed, currentLicense }: RenewLicenseModalProps) {
  const [licenseKey, setLicenseKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!currentLicense) return null

  const daysLeft = Math.ceil((new Date(currentLicense.expiresAt).getTime() - Date.now()) / 86400000)
  const isExpired = daysLeft <= 0
  const isCritical = daysLeft <= 3

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseKey.trim()) { setError("Enter a license key"); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/user/renew-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Renewal failed")
        return
      }
      toast.success(`¡Licencia renovada! +${data.daysAdded} días de Premium.`, {
        icon: "🔄",
        duration: 5000,
      })
      onRenewed(data)
      onClose()
      setLicenseKey("")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Renew License</h2>
                <p className="text-sm text-zinc-400 mt-1">Enter a new license key to extend Premium</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Current Status */}
            <div className={`rounded-xl border p-4 mb-6 ${isExpired ? 'border-red-500/20 bg-red-500/5' : isCritical ? 'border-orange-500/20 bg-orange-500/5' : 'border-zinc-700/50 bg-zinc-800/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Current License</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isExpired ? 'bg-red-500/20 text-red-400' : isCritical ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                  {isExpired ? "EXPIRED" : "ACTIVE"}
                </span>
              </div>
              <p className="text-sm text-white font-mono opacity-50">{currentLicense.licenseKey}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <span>Expires: {new Date(currentLicense.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                {!isExpired && (
                  <span className={isCritical ? "text-orange-400 font-medium" : "text-zinc-400"}>
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Warning for critical */}
            {isCritical && !isExpired && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 mb-4 flex items-start gap-2">
                <span className="text-lg shrink-0">⚠️</span>
                <p className="text-xs text-orange-300">
                  Your Premium license expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>. Renew now to avoid interruption and keep all Premium features.
                </p>
              </div>
            )}

            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5 block">New License Key</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => { setLicenseKey(e.target.value); setError("") }}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
                  autoFocus
                  disabled={loading}
                />
                {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
              </div>

              <Button type="submit" className="w-full" loading={loading} disabled={!licenseKey.trim()}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
                Renew License
              </Button>
            </form>

            <p className="text-[10px] text-zinc-600 text-center mt-4">
              Your current plan and settings will be preserved.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
