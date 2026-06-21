"use client"

import { useState, useEffect, ReactNode } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"

interface PremiumGateProps {
  children: ReactNode
  feature?: string
  fallback?: ReactNode
}

export default function PremiumGate({ children, feature, fallback }: PremiumGateProps) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showActivate, setShowActivate] = useState(false)

  useEffect(() => {
    fetch("/api/user/license")
      .then((r) => r.json())
      .then((d) => {
        setIsPremium(!!d.license && d.license.status === "active")
      })
      .catch(() => setIsPremium(false))
  }, [])

  if (isPremium === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (isPremium) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
      <p className="text-sm text-zinc-400 mb-4">
        {feature ? `"${feature}" is a premium feature.` : "Upgrade to Premium to unlock this feature."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => window.location.href = "/dashboard/plans"}>
          View Plans
        </Button>
      </div>
    </motion.div>
  )
}
