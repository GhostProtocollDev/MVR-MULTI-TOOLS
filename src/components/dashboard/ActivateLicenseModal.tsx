'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui"
import toast from "react-hot-toast"

interface ActivateLicenseModalProps {
  open: boolean
  onClose: () => void
  onActivated: (license: any) => void
}

export default function ActivateLicenseModal({ open, onClose, onActivated }: ActivateLicenseModalProps) {
  const [licenseKey, setLicenseKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseKey.trim()) { setError("Enter a license key"); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/user/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Activation failed")
        return
      }
      toast.success("¡Licencia activada! Tu cuenta ahora es Premium.", {
        icon: "🎉",
        duration: 5000,
      })
      onActivated(data.license)
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
                <h2 className="text-xl font-bold text-white">Activate License</h2>
                <p className="text-sm text-zinc-400 mt-1">Enter your license key to upgrade</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Premium Benefits */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👑</span>
                <span className="text-sm font-semibold text-yellow-400">Premium Benefits</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  "Full dashboard access",
                  "All tools unlocked",
                  "No restrictions",
                  "Priority support",
                  "License management",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-zinc-300">
                    <svg className="w-3 h-3 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5 block">License Key</label>
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
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v-2m0 0V3m0 10H7m5 0h5"/><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/></svg>
                Activate License
              </Button>
            </form>

            <p className="text-[10px] text-zinc-600 text-center mt-4">
              Don't have a license? Purchase one from the Plans page.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
