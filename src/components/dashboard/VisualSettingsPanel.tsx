'use client'

import { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store"
import { THEMES, ACCENT_COLORS } from "@/types"

const TEXT_SIZES = [
  { value: "small", label: "Small" },
  { value: "normal", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra Large" },
]

function SliderControl({ label, value, min, max, step = 1, unit = "%", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-medium text-foreground/80">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-premium"
      />
    </div>
  )
}

export default function VisualSettingsPanel() {
  const { visualSettings, setVisualSettings, showVisualSettings, setShowVisualSettings } = useAppStore()

  const handleReset = useCallback(() => {
    const { useAppStore: store } = require("@/store")
    store.getState().resetVisualSettings()
  }, [])

  return (
    <AnimatePresence>
      {showVisualSettings && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowVisualSettings(false)} />
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-80 glass overflow-y-auto scrollbar-thin shadow-2xl"
            style={{
              background: "hsl(var(--background) / 0.85)",
              backdropFilter: "blur(24px)",
              borderLeft: "1px solid hsl(var(--border) / 0.3)",
            }}
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold">Visual Settings</h2>
              <button
                onClick={() => setShowVisualSettings(false)}
                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Background Themes</h3>
                <div className="grid grid-cols-5 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setVisualSettings({ theme: t.value })}
                      className={`w-full aspect-square rounded-xl border-2 transition-all duration-200 ${
                        visualSettings.theme === t.value
                          ? "border-primary scale-105 shadow-lg shadow-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      style={{ backgroundColor: t.color }}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Accent Colors</h3>
                <div className="grid grid-cols-6 gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setVisualSettings({ accentColor: c.value })}
                      className={`w-full aspect-square rounded-full border-2 transition-all duration-200 ${
                        visualSettings.accentColor === c.value
                          ? "border-foreground scale-110 shadow-lg"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Visual Effects</h3>
                <div className="space-y-4">
                  <SliderControl label="Blur" value={visualSettings.blur} min={0} max={40} unit="px" onChange={(v) => setVisualSettings({ blur: v })} />
                  <SliderControl label="Motion Blur" value={visualSettings.motionBlur} min={0} max={40} unit="px" onChange={(v) => setVisualSettings({ motionBlur: v })} />
                  <SliderControl label="Background Visibility" value={visualSettings.backgroundVisibility} min={0} max={100} onChange={(v) => setVisualSettings({ backgroundVisibility: v })} />
                  <SliderControl label="Overlay Darkness" value={visualSettings.overlayDarkness} min={0} max={100} onChange={(v) => setVisualSettings({ overlayDarkness: v })} />
                  <SliderControl label="Card Transparency" value={visualSettings.cardTransparency} min={0} max={100} onChange={(v) => setVisualSettings({ cardTransparency: v })} />
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Image Adjustments</h3>
                <div className="space-y-4">
                  <SliderControl label="Brightness" value={visualSettings.brightness} min={50} max={150} onChange={(v) => setVisualSettings({ brightness: v })} />
                  <SliderControl label="Contrast" value={visualSettings.contrast} min={50} max={150} onChange={(v) => setVisualSettings({ contrast: v })} />
                  <SliderControl label="Saturation" value={visualSettings.saturation} min={0} max={200} onChange={(v) => setVisualSettings({ saturation: v })} />
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Interface</h3>
                <SliderControl label="Interface Scale" value={visualSettings.interfaceScale} min={50} max={150} onChange={(v) => setVisualSettings({ interfaceScale: v })} />
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Font Size</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {TEXT_SIZES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setVisualSettings({ textSize: s.value as any })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          visualSettings.textSize === s.value
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Animations</h3>
                  <button
                    onClick={() => setVisualSettings({ animationsEnabled: !visualSettings.animationsEnabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      visualSettings.animationsEnabled ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      visualSettings.animationsEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Reset All Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
