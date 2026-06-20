'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Button, Input, Card } from "@/components/ui"
import toast from "react-hot-toast"

export default function OwnerRecoveryPage() {
  const [step, setStep] = useState<"request" | "execute">("request")
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [newLicense, setNewLicense] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/owner/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", username }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Recovery initiated. Check the owner audit log.")
        setStep("execute")
      } else {
        toast.error(data.error || "Request failed")
      }
    } catch {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/owner/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", recoveryCode, newLicense, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Recovery completed! Use your new credentials to log in.")
      } else {
        toast.error(data.error || "Recovery failed")
      }
    } catch {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_50%)]" />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 7h4a2 2 0 012 2v6a2 2 0 01-2 2h-4m-4-4l-4 4m0 0l4-4m-4 4V7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Emergency Owner Recovery</h1>
          <p className="text-zinc-400 text-sm">This process is audited and monitored.</p>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-800 p-6 backdrop-blur-xl">
          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-xs text-red-400">
                This will generate a one-time recovery code logged to the owner audit log.
                You will need access to the audit log to retrieve the code.
              </div>
              <Input
                label="Owner Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white" loading={loading}>
                Request Recovery Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleExecute} className="space-y-4">
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 text-xs text-yellow-400">
                Enter the recovery code from the audit log, along with your new license key and password.
              </div>
              <Input label="Recovery Code" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required className="bg-zinc-800 border-zinc-700 text-white font-mono" placeholder="e.g. A1B2C3D4" />
              <Input label="New License Key (GHOST-XXXX-XXXX-XXXX-XXXX)" value={newLicense} onChange={(e) => setNewLicense(e.target.value.toUpperCase())} required className="bg-zinc-800 border-zinc-700 text-white font-mono" placeholder="GHOST-XXXX-XXXX-XXXX-XXXX" />
              <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-zinc-800 border-zinc-700 text-white" />
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white" loading={loading}>
                Complete Recovery
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
