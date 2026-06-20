'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/owner/dashboard" },
  { icon: "🔑", label: "License Management", href: "/owner/licenses" },
  { icon: "💳", label: "Payments Review", href: "/owner/payments" },
  { icon: "📋", label: "Plans", href: "/owner/plans" },
  { icon: "🎨", label: "Theme Management", href: "/owner/themes" },
  { icon: "📢", label: "Announcements", href: "/owner/announcements" },
  { icon: "🎫", label: "Support", href: "/owner/support" },
  { icon: "👥", label: "Clientes", href: "/dashboard/customers" },
  { icon: "🔗", label: "Referrals", href: "/owner/referrals" },
  { icon: "📝", label: "Changelog", href: "/owner/changelog" },
  { icon: "📈", label: "Analytics", href: "/owner/analytics" },
  { icon: "🛡️", label: "Security", href: "/owner/security" },
  { icon: "🔄", label: "Sessions", href: "/owner/sessions" },
  { icon: "📜", label: "Audit Log", href: "/owner/audit" },
  { icon: "⚙️", label: "Settings", href: "/owner/settings" },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user && (session.user as any).role === "owner") {
          setAuthenticated(true)
          return
        }
        fetch("/api/owner/sessions", { credentials: "include" })
          .then((res) => {
            if (!res.ok) throw new Error("Unauthorized")
            setAuthenticated(true)
          })
          .catch(() => {
            setAuthenticated(false)
            if (pathname !== "/owner") router.push("/owner")
          })
      })
      .catch(() => {
        setAuthenticated(false)
        if (pathname !== "/owner") router.push("/owner")
      })
  }, [pathname, router])

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authenticated) return null

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-zinc-900/95 border-r border-zinc-800 overflow-y-auto lg:translate-x-0 lg:static lg:z-auto"
        style={{ transform: undefined }}
      >
        <div className={`${sidebarOpen ? "" : "hidden lg:flex"} flex-col h-full`}>
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <Link href="/owner/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-white">Owner Panel</span>
              </Link>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                OWNER
              </span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "bg-red-500/10 text-red-400 font-medium border border-red-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-zinc-800">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Main
            </Link>
          </div>
        </div>
      </motion.aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>

            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Owner Session Active
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/owner/audit"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
              >
                Audit Log
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/owner/sessions?all=true", { method: "DELETE", credentials: "include" })
                  window.location.href = "/owner"
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-red-500/10"
              >
                Lock Session
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
