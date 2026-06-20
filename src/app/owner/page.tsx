'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { Button, Input, Card } from "@/components/ui"

export default function OwnerLoginPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user && (session.user as any).role === "owner") {
      router.replace("/owner/dashboard")
    }
  }, [session, router])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Authentication failed")
      } else {
        toast.success("Welcome, Owner")
        router.push("/owner/dashboard")
      }
    } catch {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            OWNER ACCESS ONLY
          </div>
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-2xl text-white">GHOST</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Owner Authentication</h1>
          <p className="text-zinc-400">Sign in with your owner credentials</p>
        </div>

        <Card className="p-6 bg-zinc-900/80 border-zinc-800 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              placeholder="owner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter owner password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500" loading={loading}>
              Authenticate
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link href="/owner/recovery" className="text-sm text-zinc-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 7h4a2 2 0 012 2v6a2 2 0 01-2 2h-4m-4-4l-4 4m0 0l4-4m-4 4V7"/></svg>
              Emergency Recovery
            </Link>
          </div>
        </Card>

        <p className="text-center mt-6 text-xs text-zinc-600">
          This area is restricted to platform owners. All access is logged and monitored.
        </p>
      </motion.div>
    </div>
  )
}
