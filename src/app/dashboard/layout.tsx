'use client'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store"
import { getLicenseColor, getLicenseBg, getLicenseLabel } from "@/lib/license-utils"
import { getRoleColor, getRoleLabel } from "@/types"
import VisualSettingsPanel from "@/components/dashboard/VisualSettingsPanel"
import BackgroundGallery from "@/components/dashboard/BackgroundGallery"
import CreateLicenseModal from "@/components/dashboard/CreateLicenseModal"
import MusicPlayerBar from "@/components/dashboard/MusicPlayerBar"

const mainNavItems = [
  { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard", roles: ["owner", "administrator", "moderator", "reseller", "user"] },
  { icon: "Eye", label: "Remote Clients", href: "/dashboard/remote/clients", roles: ["owner", "administrator"] },
  { icon: "Package", label: "Planes", href: "/dashboard/plans", roles: ["owner", "administrator", "moderator", "reseller", "user"] },
  { icon: "Music", label: "Música", href: "/dashboard/music", roles: ["owner", "administrator", "moderator", "reseller", "user"] },
  { icon: "Palette", label: "Temas", href: "/dashboard/themes", roles: ["owner", "administrator", "moderator", "reseller", "user"] },
  { icon: "Settings", label: "Ajustes", href: "/dashboard/settings", roles: ["owner", "administrator", "moderator", "reseller", "user"] },
]

const ownerNavItems = [
  { icon: "Key", label: "Crear Licencia", href: "#create-license", isModal: true },
  { icon: "FileKey", label: "Licencias", href: "/dashboard/licenses" },
  { icon: "Package", label: "Planes", href: "/dashboard/plans/manage" },
  { icon: "UserCog", label: "Usuarios", href: "/dashboard/users" },
  { icon: "Hammer", label: "Builders", href: "/dashboard/remote/builders" },
  { icon: "MonitorCog", label: "Settings", href: "/dashboard/settings/owner" },
  { icon: "DollarSign", label: "Pricing Management", href: "/dashboard/pricing" },
  { icon: "Shield", label: "Role Management", href: "/dashboard/roles" },
  { icon: "BarChart3", label: "Analytics", href: "/dashboard/analytics" },
  { icon: "ShieldAlert", label: "Security Center", href: "/dashboard/security" },
]

const iconMap: Record<string, JSX.Element> = {
  LayoutDashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  Users: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  Hammer: <><path d="M15 12l-8.5 8.5a2.121 2.121 0 01-3-3L12 9" /><path d="M17.5 5.5L21 3l-2.5 3.5L21 9l-3.5-2.5L15 6l2.5-2.5z" /></>,
  Package: <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></>,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  Key: <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></>,
  FileKey: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><circle cx="12" cy="15" r="2" /><path d="M12 17v2" /></>,
  Ban: <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>,
  UserCog: <><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="17" cy="10" r="2" /><path d="M17 8v.5" /><path d="M17 11.5V12" /></>,
  DollarSign: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
  BarChart3: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  ScrollText: <><path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h3" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="14" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></>,
  ClipboardList: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></>,
  Palette: <><circle cx="13.5" cy="6.5" r="4.5" /><circle cx="17" cy="17" r="3" /><circle cx="5.5" cy="12.5" r="3.5" /><circle cx="10" cy="21" r="2" /></>,
  Shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  ShieldAlert: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  LogOut: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  Bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  Eye: <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
  Palette2: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></>,
  MonitorCog: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><circle cx="12" cy="10" r="2" /><path d="M12 6v1" /><path d="M12 13v1" /><path d="M15.66 7.34l-.7.7" /><path d="M9.04 12.96l-.7.7" /><path d="M17 10h-1" /><path d="M8 10H7" /><path d="M15.66 12.66l-.7-.7" /><path d="M9.04 9.04l-.7-.7" /></>,
  Music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
}

function NavIcon({ name }: { name: string }) {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {iconMap[name] || iconMap.LayoutDashboard}
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { visualSettings, setVisualSettings, themeConfig, setThemeConfig, backgrounds, updateBackground, showVisualSettings, setShowVisualSettings, showCreateLicense, setShowCreateLicense } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [license, setLicense] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showBgGallery, setShowBgGallery] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [licenseLoaded, setLicenseLoaded] = useState(false)

  const user = (session?.user as any) || {}
  const userRole: string = user.role || "user"
  const isOwner = userRole === "owner"

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/user/license")
      .then((r) => r.json())
      .then((d) => { setLicense(d.license || null); setLicenseLoaded(true) })
      .catch(() => { setLicense(null); setLicenseLoaded(true) })
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--vs-blur", `${visualSettings.blur}px`)
    root.style.setProperty("--vs-motion-blur", `${visualSettings.motionBlur}px`)
    root.style.setProperty("--vs-transparency", `${visualSettings.transparency}%`)
    root.style.setProperty("--vs-brightness", `${visualSettings.brightness}%`)
    root.style.setProperty("--vs-contrast", `${visualSettings.contrast}%`)
    root.style.setProperty("--vs-saturation", `${visualSettings.saturation}%`)
    root.style.setProperty("--vs-bg-intensity", `${visualSettings.backgroundVisibility}%`)
    root.style.setProperty("--vs-scale", `${visualSettings.interfaceScale}%`)
    const sizeMap: Record<string, string> = { small: "14px", normal: "16px", large: "18px", xlarge: "20px" }
    root.style.setProperty("--vs-text-size", sizeMap[visualSettings.textSize] || "16px")
    root.classList.toggle("animations-disabled", !visualSettings.animationsEnabled)
  }, [visualSettings])

  useEffect(() => {
    const root = document.documentElement
    const themeVars: Record<string, Record<string, string>> = {
      dark:      { "--background": "240 10% 3.9%", "--card": "240 10% 5.9%", "--sidebar": "240 10% 3.9%", "--glass-bg": "240 5% 10% / 0.6" },
      light:     { "--background": "0 0% 100%", "--foreground": "240 10% 3.9%", "--card": "0 0% 100%", "--card-foreground": "240 10% 3.9%", "--border": "240 5.9% 90%", "--sidebar": "240 10% 3.9%", "--sidebar-foreground": "0 0% 95%", "--glass-bg": "255 255 255 / 0.6" },
      midnight:  { "--background": "222 84% 4%", "--card": "222 84% 8%", "--sidebar": "222 84% 4%", "--glass-bg": "222 50% 8% / 0.6" },
      ocean:     { "--background": "217 33% 6%", "--card": "217 33% 10%", "--sidebar": "217 33% 6%", "--glass-bg": "217 30% 10% / 0.6" },
      purple:    { "--background": "270 50% 6%", "--card": "270 50% 10%", "--sidebar": "270 50% 6%", "--glass-bg": "270 40% 10% / 0.6" },
      emerald:   { "--background": "160 60% 3%", "--card": "160 50% 7%", "--sidebar": "160 60% 3%", "--glass-bg": "160 40% 7% / 0.6" },
      sapphire:  { "--background": "210 60% 4%", "--card": "210 50% 8%", "--sidebar": "210 60% 4%", "--glass-bg": "210 40% 8% / 0.6" },
      crimson:   { "--background": "350 50% 5%", "--card": "350 40% 9%", "--sidebar": "350 50% 5%", "--glass-bg": "350 30% 9% / 0.6" },
      rose:      { "--background": "350 30% 6%", "--card": "350 30% 10%", "--sidebar": "350 30% 6%", "--glass-bg": "350 20% 10% / 0.6" },
      carbon:    { "--background": "0 0% 4%", "--card": "0 0% 8%", "--sidebar": "0 0% 4%", "--glass-bg": "0 0% 8% / 0.6" },
      silver:    { "--background": "0 0% 12%", "--card": "0 0% 16%", "--sidebar": "0 0% 12%", "--foreground": "0 0% 90%", "--glass-bg": "0 0% 16% / 0.6" },
      dracula:   { "--background": "231 15% 12%", "--card": "231 15% 16%", "--sidebar": "231 15% 10%", "--glass-bg": "231 15% 16% / 0.6" },
      nord:      { "--background": "220 16% 16%", "--card": "220 16% 20%", "--sidebar": "220 16% 14%", "--foreground": "222 20% 85%", "--glass-bg": "220 16% 20% / 0.6" },
      sunset:    { "--background": "15 60% 5%", "--card": "15 50% 9%", "--sidebar": "15 60% 5%", "--glass-bg": "15 40% 9% / 0.6" },
      forest:    { "--background": "120 40% 4%", "--card": "120 30% 8%", "--sidebar": "120 40% 4%", "--glass-bg": "120 30% 8% / 0.6" },
      galaxy:    { "--background": "260 60% 4%", "--card": "260 50% 8%", "--sidebar": "260 60% 4%", "--glass-bg": "260 40% 8% / 0.6" },
      aurora:    { "--background": "200 40% 6%", "--card": "200 35% 10%", "--sidebar": "200 40% 6%", "--glass-bg": "200 30% 10% / 0.6" },
    }
    const accentVars: Record<string, Record<string, string>> = {
      violet: { "--primary": "262 83% 58%", "--primary-500": "262 83% 58%", "--ring": "262 83% 58%", "--primary-rgb": "139, 92, 246", "--sidebar-accent": "262 83% 58%", "--accent-h": "262", "--accent-s": "83%", "--accent-l": "58%" },
      blue:   { "--primary": "221 83% 53%", "--primary-500": "221 83% 53%", "--ring": "221 83% 53%", "--primary-rgb": "59, 130, 246", "--sidebar-accent": "221 83% 53%", "--accent-h": "221", "--accent-s": "83%", "--accent-l": "53%" },
      green:  { "--primary": "142 71% 45%", "--primary-500": "142 71% 45%", "--ring": "142 71% 45%", "--primary-rgb": "34, 197, 94", "--sidebar-accent": "142 71% 45%", "--accent-h": "142", "--accent-s": "71%", "--accent-l": "45%" },
      red:    { "--primary": "0 84% 60%", "--primary-500": "0 84% 60%", "--ring": "0 84% 60%", "--primary-rgb": "239, 68, 68", "--sidebar-accent": "0 84% 60%", "--accent-h": "0", "--accent-s": "84%", "--accent-l": "60%" },
      orange: { "--primary": "24 95% 53%", "--primary-500": "24 95% 53%", "--ring": "24 95% 53%", "--primary-rgb": "249, 115, 22", "--sidebar-accent": "24 95% 53%", "--accent-h": "24", "--accent-s": "95%", "--accent-l": "53%" },
      pink:   { "--primary": "330 81% 60%", "--primary-500": "330 81% 60%", "--ring": "330 81% 60%", "--primary-rgb": "236, 72, 153", "--sidebar-accent": "330 81% 60%", "--accent-h": "330", "--accent-s": "81%", "--accent-l": "60%" },
      teal:   { "--primary": "173 80% 40%", "--primary-500": "173 80% 40%", "--ring": "173 80% 40%", "--primary-rgb": "20, 184, 166", "--sidebar-accent": "173 80% 40%", "--accent-h": "173", "--accent-s": "80%", "--accent-l": "40%" },
      yellow: { "--primary": "45 93% 47%", "--primary-500": "45 93% 47%", "--ring": "45 93% 47%", "--primary-rgb": "234, 179, 8", "--sidebar-accent": "45 93% 47%", "--accent-h": "45", "--accent-s": "93%", "--accent-l": "47%" },
      indigo: { "--primary": "239 84% 67%", "--primary-500": "239 84% 67%", "--ring": "239 84% 67%", "--primary-rgb": "129, 140, 248", "--sidebar-accent": "239 84% 67%", "--accent-h": "239", "--accent-s": "84%", "--accent-l": "67%" },
      cyan:   { "--primary": "189 94% 43%", "--primary-500": "189 94% 43%", "--ring": "189 94% 43%", "--primary-rgb": "6, 182, 212", "--sidebar-accent": "189 94% 43%", "--accent-h": "189", "--accent-s": "94%", "--accent-l": "43%" },
      amber:  { "--primary": "38 92% 50%", "--primary-500": "38 92% 50%", "--ring": "38 92% 50%", "--primary-rgb": "245, 158, 11", "--sidebar-accent": "38 92% 50%", "--accent-h": "38", "--accent-s": "92%", "--accent-l": "50%" },
      lime:   { "--primary": "83 72% 40%", "--primary-500": "83 72% 40%", "--ring": "83 72% 40%", "--primary-rgb": "132, 204, 22", "--sidebar-accent": "83 72% 40%", "--accent-h": "83", "--accent-s": "72%", "--accent-l": "40%" },
    }
    const tv = themeVars[visualSettings.theme] || themeVars.dark
    for (const [key, val] of Object.entries(tv)) root.style.setProperty(key, val)
    const av = accentVars[visualSettings.accentColor] || accentVars.violet
    for (const [key, val] of Object.entries(av)) root.style.setProperty(key, val)
  }, [visualSettings.theme, visualSettings.accentColor])

  // Load settings from server on mount
  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.settings) return
        const s = d.settings
        setVisualSettings({
          theme: s.theme || "dark",
          accentColor: s.accentColor || "violet",
          background: s.background || null,
          blur: s.blur ?? 20,
          motionBlur: s.motionBlur ?? 10,
          transparency: s.transparency ?? 0,
          brightness: s.brightness ?? 100,
          contrast: s.contrast ?? 100,
          saturation: s.saturation ?? 100,
          backgroundVisibility: s.bgIntensity ?? 100,
          interfaceScale: s.scale ?? 100,
          textSize: s.textSize || "normal",
          animationsEnabled: s.animationsEnabled ?? true,
        })
      })
      .catch(() => {})
  }, [])

  // Auto-save to server when visualSettings change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: visualSettings.theme,
          accentColor: visualSettings.accentColor,
          background: visualSettings.background,
          blur: visualSettings.blur,
          motionBlur: visualSettings.motionBlur,
          transparency: visualSettings.transparency,
          brightness: visualSettings.brightness,
          contrast: visualSettings.contrast,
          saturation: visualSettings.saturation,
          bgIntensity: visualSettings.backgroundVisibility,
          scale: visualSettings.interfaceScale,
          textSize: visualSettings.textSize,
          animationsEnabled: visualSettings.animationsEnabled,
        }),
      }).catch(() => {})
    }, 2000)
    return () => clearTimeout(timer)
  }, [visualSettings])

  const handleSetActiveBg = useCallback((url: string | null) => {
    setVisualSettings({ background: url })
    setShowBgGallery(false)
  }, [setVisualSettings])

  const licenseInfo = license ? (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{user.name || user.username || "User"}</span>
            {isOwner ? (
              <span className="owner-badge shrink-0">👑 Owner</span>
            ) : (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                style={{ backgroundColor: getRoleColor(userRole), color: "#000" }}
              >
                {getRoleLabel(userRole)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isOwner ? (
              <span className="text-[11px] font-semibold text-yellow-400/80">👑 LIFETIME · PERMANENT ACCESS</span>
            ) : (
              <>
                <span className="text-[11px] font-medium" style={{ color: getLicenseColor(license) }}>
                  {getLicenseLabel(license)}
                </span>
                {license.expiresAt && !license.isLifetime && (
                  <span className="text-[10px] text-muted-foreground">
                    {(() => {
                      const days = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000)
                      return days > 0 ? `${days}d remaining` : "Expired"
                    })()}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {!isOwner && license && !license.isLifetime && (
        <Link
          href="/dashboard/plans"
          className="mt-2 w-full h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Renew
        </Link>
      )}
    </div>
  ) : (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold shrink-0">
          {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{user.name || user.username || "User"}</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
              style={{ backgroundColor: getRoleColor(userRole), color: "#000" }}
            >
              {getRoleLabel(userRole)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">FREE PLAN</span>
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/plans"
        className="mt-2 w-full h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add License
      </Link>
    </div>
  )

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  function SidebarNavItem({ href, icon, label, isOwnerItem = false, isModal = false }: { href: string; icon: string; label: string; isOwnerItem?: boolean; isModal?: boolean }) {
    const active = isActive(href)
    if (isModal) {
      return (
        <button
          onClick={() => { setShowCreateLicense(true); setSidebarOpen(false) }}
          className={`nav-item w-full text-left ${isOwnerItem ? "nav-item-owner" : ""}`}
        >
          <NavIcon name={icon} />
          <span>{label}</span>
        </button>
      )
    }
    return (
      <Link
        href={href}
        className={`nav-item ${active ? (isOwnerItem ? "nav-item-owner-active" : "nav-item-active") : ""} ${isOwnerItem && !active ? "nav-item-owner" : ""}`}
        onClick={() => setSidebarOpen(false)}
      >
        <NavIcon name={icon} />
        <span>{label}</span>
        {active && (
          <motion.div
            layoutId={`nav-indicator-${isOwnerItem ? "owner" : "main"}`}
            className={`absolute right-2 w-1.5 h-1.5 rounded-full ${isOwnerItem ? "bg-yellow-400" : "bg-primary"}`}
            style={{ boxShadow: `0 0 8px ${isOwnerItem ? "hsl(45 93% 47% / 0.6)" : "hsl(var(--primary) / 0.6)"}` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    )
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        filter: `brightness(${visualSettings.brightness}%) contrast(${visualSettings.contrast}%) saturate(${visualSettings.saturation}%)`,
        fontSize: mounted ? "var(--vs-text-size)" : "16px",
      }}
    >
      {visualSettings.background && (
        <div className="fixed inset-0 -z-20">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${visualSettings.background})`, opacity: visualSettings.backgroundVisibility / 100 }}
          />
          {visualSettings.backgroundOverlay && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, hsl(var(--background) / ${visualSettings.overlayDarkness / 100}), hsl(var(--background) / ${visualSettings.overlayDarkness * 0.8 / 100}))`,
              }}
            />
          )}
        </div>
      )}
      <div className="fixed inset-0 -z-30 bg-background" />
      <div className="fixed inset-0 -z-10 bg-grid opacity-[0.03]" />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-[240px] glass-sidebar flex flex-col
        transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-sidebar-border/50">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-base">G</span>
              </div>
              <div>
                <span className="font-bold text-base text-sidebar-foreground">GHOST</span>
                <span className="block text-[10px] text-sidebar-muted font-medium tracking-wider uppercase">License System</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            <div className="space-y-0.5">
              {mainNavItems.filter((item) => item.roles.includes(userRole as any) || isOwner).map((item) => (
                <SidebarNavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </div>

            {isOwner && (
              <div className="pt-4 mt-4 border-t border-sidebar-border/40">
                <div className="flex items-center gap-3 px-3 mb-2">
                  <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-[0.15em]">Owner Panel</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/30 to-transparent" />
                </div>
                <div className="space-y-0.5">
                  {ownerNavItems.map((item) => (
                    <SidebarNavItem key={item.href} href={item.href} icon={item.icon} label={item.label} isOwnerItem isModal={(item as any).isModal} />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-sidebar-border/40">
              <button
                onClick={() => signOut()}
                className="nav-item text-red-400/50 hover:text-red-400 hover:bg-red-500/5 w-full"
              >
                <NavIcon name="LogOut" />
                <span>Logout</span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-sidebar-border/50">
            {licenseLoaded ? (
              <div className="glass rounded-xl p-3">
                {licenseInfo}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>
        <header className="glass-header sticky top-0 z-30 h-16">
          <div className="flex items-center justify-between px-4 lg:px-8 h-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVisualSettings(!showVisualSettings)}
                className="w-9 h-9 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground relative"
                title="Visual Settings"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </button>

              <button
                onClick={() => setShowBgGallery(!showBgGallery)}
                className="w-9 h-9 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground relative"
                title="Background Gallery"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/20">
                    {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-tight">{user.name || user.username || "User"}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isOwner ? (
                        <span className="owner-badge text-[9px] px-1.5 py-0">👑 OWNER</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRoleColor(userRole) }} />
                          {getRoleLabel(userRole)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {showProfile && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 w-72"
                      >
                        <div className="glass rounded-2xl p-4 shadow-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                              {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{user.name || user.username}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>

                          {license ? (
                            <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-muted/30">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">License</span>
                                <span className="font-medium">{isOwner ? "👑 LIFETIME" : getLicenseLabel(license)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">{getRoleLabel(userRole)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium text-success">Active</span>
                              </div>
                              {license.expiresAt && !license.isLifetime && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Expires</span>
                                  <span className="font-medium">
                                    {Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000)}d
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-muted/30">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Plan</span>
                                <span className="font-medium text-muted-foreground">FREE</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">{getRoleLabel(userRole)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium text-muted-foreground">No License</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <button
                              onClick={() => { router.push("/dashboard/settings"); setShowProfile(false) }}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                              Settings
                            </button>
                            <button
                              onClick={() => signOut()}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main
          className="flex-1 p-4 lg:p-8 transition-all duration-300"
          style={{
            transform: `scale(${visualSettings.interfaceScale / 100})`,
            transformOrigin: "top center",
          }}
        >
          {children}
        </main>
      </div>

      <AnimatePresence>
        {showBgGallery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 w-96 glass rounded-2xl shadow-2xl p-4 max-h-[60vh] overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Background Gallery</h3>
              <button
                onClick={() => setShowBgGallery(false)}
                className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <BackgroundGallery />
          </motion.div>
        )}
      </AnimatePresence>

      <VisualSettingsPanel />
      <CreateLicenseModal />
      <MusicPlayerBar />
    </div>
  )
}
