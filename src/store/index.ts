import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { VisualSettings, BackgroundImage } from "@/types"

interface ThemeConfig {
  accentColor: string
  layout: string
  sidebarCollapsed: boolean
}

interface AppStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  themeConfig: ThemeConfig
  setThemeConfig: (config: Partial<ThemeConfig>) => void
  visualSettings: VisualSettings
  setVisualSettings: (settings: Partial<VisualSettings>) => void
  resetVisualSettings: () => void
  backgrounds: BackgroundImage[]
  setBackgrounds: (backgrounds: BackgroundImage[]) => void
  addBackground: (bg: BackgroundImage) => void
  removeBackground: (id: string) => void
  updateBackground: (id: string, updates: Partial<BackgroundImage>) => void
  setActiveBackground: (id: string | null) => void
  notifications: any[]
  setNotifications: (notifications: any[]) => void
  addNotification: (notification: any) => void
  markNotificationRead: (id: string) => void
  showVisualSettings: boolean
  setShowVisualSettings: (show: boolean) => void
  showCreateLicense: boolean
  setShowCreateLicense: (show: boolean) => void
}

export const defaultVisualSettings: VisualSettings = {
  theme: "dark",
  accentColor: "violet",
  background: null,
  backgroundOverlay: true,
  overlayDarkness: 60,
  overlayOpacity: 70,
  backgroundVisibility: 100,
  blur: 20,
  motionBlur: 10,
  transparency: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  scale: 100,
  textSize: "normal",
  animationsEnabled: true,
  cardTransparency: 0,
  interfaceScale: 100,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      themeConfig: {
        accentColor: "violet",
        layout: "default",
        sidebarCollapsed: false,
      },
      setThemeConfig: (config) =>
        set((state) => ({
          themeConfig: { ...state.themeConfig, ...config },
        })),
      visualSettings: { ...defaultVisualSettings },
      setVisualSettings: (settings) =>
        set((state) => ({
          visualSettings: { ...state.visualSettings, ...settings },
        })),
      resetVisualSettings: () =>
        set((state) => ({
          visualSettings: { ...defaultVisualSettings },
          backgrounds: state.backgrounds,
        })),
      backgrounds: [],
      setBackgrounds: (backgrounds) => set({ backgrounds }),
      addBackground: (bg) =>
        set((state) => ({
          backgrounds: [...state.backgrounds, bg],
        })),
      removeBackground: (id) =>
        set((state) => ({
          backgrounds: state.backgrounds.filter((b) => b.id !== id),
          visualSettings:
            state.visualSettings.background ===
            state.backgrounds.find((b) => b.id === id)?.url
              ? { ...state.visualSettings, background: null }
              : state.visualSettings,
        })),
      updateBackground: (id, updates) =>
        set((state) => ({
          backgrounds: state.backgrounds.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      setActiveBackground: (id) =>
        set((state) => ({
          backgrounds: state.backgrounds.map((b) => ({
            ...b,
            isActive: b.id === id,
          })),
          visualSettings: {
            ...state.visualSettings,
            background: id
              ? state.backgrounds.find((b) => b.id === id)?.url || null
              : null,
          },
        })),
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      showVisualSettings: false,
      setShowVisualSettings: (show) => set({ showVisualSettings: show }),
      showCreateLicense: false,
      setShowCreateLicense: (show) => set({ showCreateLicense: show }),
    }),
    {
      name: "pag-store",
      partialize: (state) => ({
        themeConfig: state.themeConfig,
        visualSettings: state.visualSettings,
        backgrounds: state.backgrounds,
      }),
    }
  )
)
