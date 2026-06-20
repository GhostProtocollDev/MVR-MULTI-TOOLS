'use client'

import { useRef } from "react"
import { motion } from "framer-motion"
import { useAppStore } from "@/store"
import { THEMES, ACCENT_COLORS } from "@/types"
import toast from "react-hot-toast"

export default function ThemesPage() {
  const { visualSettings, setVisualSettings, themeConfig, setThemeConfig } = useAppStore()
  const bgInputRef = useRef<HTMLInputElement>(null)

  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setVisualSettings({ background: ev.target?.result as string })
      toast.success("Background updated")
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Theme Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">Create, edit, and manage themes and visual settings</p>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold mb-4">Background Themes</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setVisualSettings({ theme: theme.value })}
              className={`relative p-2.5 rounded-xl border-2 transition-all ${
                visualSettings.theme === theme.value
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "border-border/40 hover:border-primary/30"
              }`}
            >
              <div className="w-full aspect-[3/2] rounded-lg mb-1.5" style={{ backgroundColor: theme.color }} />
              <span className="text-[10px] font-medium block truncate">{theme.label}</span>
              {visualSettings.theme === theme.value && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold mb-4">Accent Colors</h3>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_COLORS.map((accent) => (
            <button
              key={accent.value}
              onClick={() => { setVisualSettings({ accentColor: accent.value }); toast.success(`Accent: ${accent.label}`) }}
              className={`w-9 h-9 rounded-xl transition-all ${
                visualSettings.accentColor === accent.value
                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: accent.color }}
              title={accent.label}
            />
          ))}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold mb-4">Background Image</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <input ref={bgInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleBgUpload} className="hidden" />
            <div
              onClick={() => bgInputRef.current?.click()}
              className="h-32 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              {visualSettings.background ? (
                <div className="w-full h-full rounded-xl bg-cover bg-center relative group" style={{ backgroundImage: `url(${visualSettings.background})` }}>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">Click to change</span>
                  </div>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-muted-foreground mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-xs text-muted-foreground">Upload PNG, JPG, WEBP, GIF</span>
                </>
              )}
            </div>
            {visualSettings.background && (
              <button onClick={() => { setVisualSettings({ background: null }); toast.success("Background removed") }} className="text-xs text-destructive hover:underline mt-1">
                Remove background
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Background Visibility</label>
              <input type="range" min={0} max={100} value={visualSettings.backgroundVisibility} onChange={(e) => setVisualSettings({ backgroundVisibility: Number(e.target.value) })} className="slider-premium" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Overlay Darkness</label>
              <input type="range" min={0} max={100} value={visualSettings.overlayDarkness} onChange={(e) => setVisualSettings({ overlayDarkness: Number(e.target.value) })} className="slider-premium" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground">Overlay</label>
              <button
                onClick={() => setVisualSettings({ backgroundOverlay: !visualSettings.backgroundOverlay })}
                className={`relative w-9 h-5 rounded-full transition-colors ${visualSettings.backgroundOverlay ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${visualSettings.backgroundOverlay ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold mb-4">Visual Effects</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SliderSetting label="Blur" value={visualSettings.blur} onChange={(v) => setVisualSettings({ blur: v })} unit="px" />
          <SliderSetting label="Motion Blur" value={visualSettings.motionBlur} onChange={(v) => setVisualSettings({ motionBlur: v })} unit="px" />
          <SliderSetting label="Card Transparency" value={visualSettings.cardTransparency} onChange={(v) => setVisualSettings({ cardTransparency: v })} unit="%" />
          <SliderSetting label="Brightness" value={visualSettings.brightness} onChange={(v) => setVisualSettings({ brightness: v })} min={50} max={150} unit="%" />
          <SliderSetting label="Contrast" value={visualSettings.contrast} onChange={(v) => setVisualSettings({ contrast: v })} min={50} max={150} unit="%" />
          <SliderSetting label="Saturation" value={visualSettings.saturation} onChange={(v) => setVisualSettings({ saturation: v })} min={0} max={200} unit="%" />
        </div>
      </div>

      <div className="glass-card">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Font Size</h3>
            <div className="grid grid-cols-4 gap-2">
              {(["small", "normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setVisualSettings({ textSize: size })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    visualSettings.textSize === size
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1, 2) === "X" ? "XL" : size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Interface Scale</h3>
            <input type="range" min={50} max={150} value={visualSettings.interfaceScale} onChange={(e) => setVisualSettings({ interfaceScale: Number(e.target.value) })} className="slider-premium" />
            <div className="text-xs text-muted-foreground text-center mt-1">{visualSettings.interfaceScale}%</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Animations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enable or disable all animations</p>
          </div>
          <button
            onClick={() => setVisualSettings({ animationsEnabled: !visualSettings.animationsEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${visualSettings.animationsEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${visualSettings.animationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        All settings are saved automatically and restored on return.
      </div>
    </motion.div>
  )
}

function SliderSetting({ label, value, onChange, min = 0, max = 100, unit = "" }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-medium">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="slider-premium" />
    </div>
  )
}
