'use client'

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface ThemeUser {
  id: string
  name: string | null
  image: string | null
  username: string
}

interface Theme {
  id: string
  name: string
  description: string | null
  slug: string
  type: string
  category: string | null
  isPublic: boolean
  featured: boolean
  isPremium: boolean
  config: string
  wallpaper: string | null
  background: string | null
  accentColor: string | null
  downloads: number
  rating: number
  createdAt: string
  userId: string | null
  user: ThemeUser | null
  _count?: { reviews: number }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  count: number
}

const CATEGORY_COLORS: Record<string, string> = {
  anime: "#FF6B9D",
  gaming: "#6C5CE7",
  cyberpunk: "#00F5FF",
  neon: "#39FF14",
  luxury: "#FFD700",
  technology: "#4FC3F7",
  space: "#7C4DFF",
  abstract: "#FF4081",
  dark: "#37474F",
  minimalist: "#B0BEC5",
}

function parseColors(theme: Theme): string[] {
  const colors: string[] = []
  if (theme.accentColor) {
    const accentMap: Record<string, string> = {
      violet: "#8b5cf6", blue: "#3b82f6", green: "#22c55e", red: "#ef4444",
      orange: "#f97316", pink: "#ec4899", teal: "#14b8a6", yellow: "#eab308",
      indigo: "#818cf8", cyan: "#06b6d4", amber: "#f59e0b", lime: "#84cc16",
    }
    colors.push(accentMap[theme.accentColor] || "#8b5cf6")
  }
  try {
    const cfg = JSON.parse(theme.config)
    if (cfg.primaryColor) colors.push(cfg.primaryColor)
    if (cfg.secondaryColor) colors.push(cfg.secondaryColor)
    if (cfg.surfaceColor) colors.push(cfg.surfaceColor)
  } catch {}
  if (colors.length === 0) colors.push("#8b5cf6", "#1e1b4b", "#312e81")
  return colors.slice(0, 5)
}

function getCategoryColor(cat: string | null): string {
  return cat ? CATEGORY_COLORS[cat] || "#8b5cf6" : "#8b5cf6"
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 365) return `${Math.floor(days / 365)}y ago`
  if (days > 30) return `${Math.floor(days / 30)}mo ago`
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h ago`
  return "just now"
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={star <= Math.round(rating) ? "text-yellow-400" : "text-zinc-700"} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function OwnerThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [myThemes, setMyThemes] = useState<Theme[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeTab, setActiveTab] = useState<"marketplace" | "my">("marketplace")
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "dark",
    isPublic: false,
    config: "{}",
    wallpaper: "",
    background: "",
    accentColor: "violet",
  })

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.id) setCurrentUserId(session.user.id)
      })
      .catch(() => {})
  }, [])

  const fetchThemes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== "all") params.set("category", activeCategory)
      if (search) params.set("search", search)
      const res = await fetch(`/api/themes?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setThemes(data.themes || [])
    } catch {} finally { setLoading(false) }
  }, [activeCategory, search])

  const fetchMyThemes = useCallback(async () => {
    try {
      const res = await fetch("/api/themes?my=true")
      if (!res.ok) return
      const data = await res.json()
      setMyThemes(data.themes || [])
    } catch {}
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/themes/categories")
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {}
  }, [])

  useEffect(() => { fetchThemes() }, [fetchThemes])
  useEffect(() => { fetchMyThemes() }, [fetchMyThemes])
  useEffect(() => { fetchCategories() }, [fetchCategories])

  const displayThemes = activeTab === "marketplace" ? themes : myThemes

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return }
      toast.success("Theme created!")
      setShowCreateModal(false)
      setForm({ name: "", description: "", category: "dark", isPublic: false, config: "{}", wallpaper: "", background: "", accentColor: "violet" })
      fetchMyThemes()
      fetchThemes()
    } catch { toast.error("Network error") } finally { setSubmitting(false) }
  }

  async function handleDelete(themeId: string) {
    if (!confirm("Delete this theme?")) return
    try {
      const res = await fetch(`/api/themes?id=${themeId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete"); return }
      toast.success("Theme deleted")
      fetchMyThemes()
      fetchThemes()
    } catch { toast.error("Network error") }
  }

  async function handleLike(_themeId: string) {
    toast.success("Theme liked!")
  }

  async function handleDownload(theme: Theme) {
    try {
      const blob = new Blob([JSON.stringify(JSON.parse(theme.config), null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${theme.slug}-theme.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloading ${theme.name} config`)
    } catch { toast.error("Failed to download config") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Theme Marketplace</h1>
          <p className="text-zinc-400 text-sm mt-1">Discover, create, and manage visual themes</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Create Theme
          </span>
        </motion.button>
      </div>

      <div className="flex gap-1 rounded-lg bg-zinc-900/80 border border-zinc-800 p-1 w-fit">
        {(["marketplace", "my"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize",
              activeTab === tab
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab === "marketplace" ? "Marketplace" : "My Themes"}
            {tab === "my" && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-violet-500/10 text-violet-400">
                {myThemes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "marketplace" && (
        <>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search themes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <CategoryPill
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              All
            </CategoryPill>
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={activeCategory === cat.id}
                color={CATEGORY_COLORS[cat.id]}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </CategoryPill>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse">
              <div className="h-32 rounded-lg bg-zinc-800 mb-4" />
              <div className="h-4 w-3/4 bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-1/2 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : displayThemes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-zinc-400 text-sm">
            {activeTab === "my" ? "You haven't created any themes yet" : "No themes found"}
          </p>
          {activeTab === "my" && (
            <button onClick={() => setShowCreateModal(true)} className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Create your first theme
            </button>
          )}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onClick={() => { setSelectedTheme(theme); setShowDetailModal(true) }}
              onDelete={handleDelete}
              onEdit={() => {
                setForm({
                  name: theme.name,
                  description: theme.description || "",
                  category: theme.category || "dark",
                  isPublic: theme.isPublic,
                  config: theme.config,
                  wallpaper: theme.wallpaper || "",
                  background: theme.background || "",
                  accentColor: theme.accentColor || "violet",
                })
                setShowCreateModal(true)
              }}
              showActions={activeTab === "my"}
            />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-50 w-full max-w-2xl mx-auto"
            >
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Create Theme</h2>
                  <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="My Awesome Theme"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe your theme..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Theme Config (JSON)</label>
                    <textarea
                      value={form.config}
                      onChange={(e) => setForm({ ...form, config: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors font-mono resize-none"
                      placeholder='{ "primaryColor": "#8b5cf6", "secondaryColor": "#1e1b4b", ... }'
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Background URL</label>
                      <input
                        value={form.background}
                        onChange={(e) => setForm({ ...form, background: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Wallpaper URL</label>
                      <input
                        value={form.wallpaper}
                        onChange={(e) => setForm({ ...form, wallpaper: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Accent Color</label>
                      <select
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                      >
                        {["violet", "blue", "green", "red", "orange", "pink", "teal", "yellow", "indigo", "cyan", "amber", "lime"].map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublic ? "bg-violet-500" : "bg-zinc-700"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPublic ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm text-zinc-300">Make public</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    Create Theme
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-50 w-full max-w-3xl mx-auto"
            >
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900">
                  {selectedTheme.background && (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${selectedTheme.background})` }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {selectedTheme.featured && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Featured</span>
                    )}
                    {selectedTheme.isPremium && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Premium</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="absolute bottom-4 left-6">
                    <h2 className="text-2xl font-bold text-white">{selectedTheme.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      {selectedTheme.user && (
                        <div className="flex items-center gap-2">
                          {selectedTheme.user.image ? (
                            <img src={selectedTheme.user.image} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                              {(selectedTheme.user.name || selectedTheme.user.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-zinc-300">{selectedTheme.user.name || selectedTheme.user.username}</span>
                        </div>
                      )}
                      {selectedTheme.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${getCategoryColor(selectedTheme.category)}20`, color: getCategoryColor(selectedTheme.category) }}>
                          {categories.find((c) => c.id === selectedTheme.category)?.name || selectedTheme.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {selectedTheme.description && (
                    <p className="text-sm text-zinc-400 leading-relaxed">{selectedTheme.description}</p>
                  )}

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Stars rating={selectedTheme.rating} />
                      <span className="text-sm text-zinc-400">{selectedTheme.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>{selectedTheme.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20l-7-7 7-7 7 7-7 7z"/></svg>
                      <span>{selectedTheme._count?.reviews || 0} reviews</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Preview Colors</label>
                    <div className="flex gap-2">
                      {parseColors(selectedTheme).map((color, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg border border-zinc-700" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Config Preview</label>
                    <pre className="bg-zinc-800/60 rounded-xl p-4 text-xs text-zinc-300 font-mono overflow-x-auto max-h-40 border border-zinc-800">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selectedTheme.config), null, 2) }
                        catch { return selectedTheme.config }
                      })()}
                    </pre>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDownload(selectedTheme)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Config
                    </button>
                    <button
                      onClick={() => handleLike(selectedTheme.id)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      Like
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CategoryPill({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
        active
          ? "text-white border-transparent shadow-sm"
          : "text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-900/40"
      )}
      style={active ? { backgroundColor: color ? `${color}20` : "#8b5cf620", borderColor: color ? `${color}50` : "#8b5cf650" } : undefined}
    >
      {children}
    </button>
  )
}

function ThemeCard({ theme, onClick, onDelete, onEdit, showActions }: {
  theme: Theme
  onClick: () => void
  onDelete: (id: string) => void
  onEdit: () => void
  showActions: boolean
}) {
  const colors = parseColors(theme)
  const catColor = getCategoryColor(theme.category)

  return (
    <motion.div
      variants={itemAnim}
      layout
      whileHover={{ y: -4 }}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900">
        {theme.background && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${theme.background})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {colors.slice(0, 4).map((color, i) => (
            <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          {theme.featured && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">FEATURED</span>
          )}
          {theme.isPremium && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">PREMIUM</span>
          )}
        </div>
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          {theme.user && (
            <div className="flex items-center gap-1.5">
              {theme.user.image ? (
                <img src={theme.user.image} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] text-zinc-400 font-medium ring-1 ring-white/10">
                  {(theme.user.name || theme.user.username || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-zinc-300 truncate max-w-[100px]">{theme.user.name || theme.user.username}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {theme.downloads}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{theme.name}</h3>
            {theme.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{theme.description}</p>
            )}
          </div>
          <Stars rating={theme.rating} size={10} />
        </div>

        <div className="flex items-center justify-between mt-3">
          {theme.category && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-medium"
              style={{ backgroundColor: `${catColor}15`, color: catColor }}
            >
              {theme.category.charAt(0).toUpperCase() + theme.category.slice(1)}
            </span>
          )}
          <span className="text-[10px] text-zinc-600">{timeAgo(theme.createdAt)}</span>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(theme.id) }}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
