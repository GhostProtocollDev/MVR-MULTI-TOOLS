'use client'

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store"
import toast from "react-hot-toast"

export default function BackgroundGallery() {
  const { backgrounds, setBackgrounds, addBackground, removeBackground, updateBackground, setActiveBackground, visualSettings, setVisualSettings } = useAppStore()
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/background", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addBackground(data)
      toast.success("Background uploaded")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [addBackground])

  const handleDelete = useCallback(async (bg: any) => {
    try {
      const filename = bg.url.split("/").pop()
      const res = await fetch("/api/backgrounds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      })
      if (!res.ok) throw new Error("Delete failed")
      removeBackground(bg.id)
      toast.success("Background deleted")
    } catch (err: any) {
      toast.error(err.message)
    }
  }, [removeBackground])

  const handleSetActive = useCallback((bg: any) => {
    if (visualSettings.background === bg.url) {
      setVisualSettings({ background: null })
      setActiveBackground(null)
    } else {
      setVisualSettings({ background: bg.url })
      backgrounds.forEach((b) => updateBackground(b.id, { isActive: false }))
      updateBackground(bg.id, { isActive: true })
    }
  }, [visualSettings.background, setVisualSettings, setActiveBackground, backgrounds, updateBackground])

  const handleRename = useCallback((bg: any) => {
    setEditingId(bg.id)
    setEditName(bg.name)
  }, [])

  const handleSaveRename = useCallback((bg: any) => {
    if (editName.trim()) {
      updateBackground(bg.id, { name: editName.trim() })
    }
    setEditingId(null)
  }, [editName, updateBackground])

  const handleToggleFavorite = useCallback((bg: any) => {
    updateBackground(bg.id, { isFavorite: !bg.isFavorite })
  }, [updateBackground])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Gallery</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            setVisualSettings({ background: null })
            backgrounds.forEach((b) => updateBackground(b.id, { isActive: false }))
          }}
          className={`aspect-video rounded-xl border-2 transition-all overflow-hidden relative ${
            !visualSettings.background
              ? "border-primary"
              : "border-border/50 hover:border-muted-foreground/30"
          }`}
        >
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <svg className="w-6 h-6 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center text-muted-foreground bg-background/80 rounded py-0.5 px-1 truncate">
            None
          </span>
        </button>

        {backgrounds.map((bg) => (
          <div
            key={bg.id}
            className={`aspect-video rounded-xl border-2 transition-all overflow-hidden relative group ${
              visualSettings.background === bg.url
                ? "border-primary"
                : "border-border/50 hover:border-muted-foreground/30"
            }`}
          >
            <button onClick={() => handleSetActive(bg)} className="w-full h-full">
              <img
                src={bg.url}
                alt={bg.name}
                className="w-full h-full object-cover"
              />
            </button>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); handleSetActive(bg) }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  visualSettings.background === bg.url
                    ? "bg-primary text-white"
                    : "bg-white/20 text-white hover:bg-white/40"
                }`}
              >
                {visualSettings.background === bg.url ? "✓" : "○"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(bg) }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  bg.isFavorite ? "bg-yellow-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                }`}
              >
                ★
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRename(bg) }}
                className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 text-[10px] transition-all"
              >
                ✎
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(bg) }}
                className="w-6 h-6 rounded-full bg-red-500/60 text-white flex items-center justify-center hover:bg-red-500/80 text-[10px] transition-all"
              >
                ✕
              </button>
            </div>

            <AnimatePresence>
              {editingId === bg.id ? (
                <div className="absolute bottom-1 left-1 right-1 z-10">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveRename(bg)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveRename(bg); if (e.key === "Escape") setEditingId(null) }}
                    className="w-full text-[10px] px-1.5 py-0.5 rounded bg-background/90 border border-primary/50 text-foreground"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center text-muted-foreground bg-background/80 rounded py-0.5 px-1 truncate">
                  {bg.name}
                </span>
              )}
            </AnimatePresence>

            {bg.isFavorite && (
              <div className="absolute top-1 right-1 w-3 h-3">
                <span className="text-yellow-500 text-[10px]">★</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
