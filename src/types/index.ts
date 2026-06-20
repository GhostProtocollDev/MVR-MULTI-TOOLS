import type { User } from "next-auth"

export type UserRole = "owner" | "administrator" | "moderator" | "reseller" | "user"

export const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "owner", label: "Owner", color: "#FFD700" },
  { value: "administrator", label: "Administrator", color: "#EF4444" },
  { value: "moderator", label: "Moderator", color: "#3B82F6" },
  { value: "reseller", label: "Reseller", color: "#10B981" },
  { value: "user", label: "User", color: "#6B7280" },
]

export function getRoleColor(role: string): string {
  return ROLES.find((r) => r.value === role)?.color || "#6B7280"
}

export function getRoleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label || role
}

export const LICENSE_DURATIONS = [
  { value: "lifetime", label: "Lifetime" },
  { value: "24months", label: "24 Months" },
  { value: "12months", label: "12 Months" },
  { value: "6months", label: "6 Months" },
  { value: "3months", label: "3 Months" },
  { value: "1month", label: "1 Month" },
  { value: "2weeks", label: "2 Weeks" },
  { value: "1week", label: "1 Week" },
  { value: "trial", label: "Trial" },
]

export function getDurationDays(duration: string): number | null {
  const map: Record<string, number | null> = {
    lifetime: null,
    "24months": 730,
    "12months": 365,
    "6months": 182,
    "3months": 91,
    "1month": 30,
    "2weeks": 14,
    "1week": 7,
    trial: 3,
  }
  return map[duration] ?? 30
}

export const THEMES = [
  { value: "dark", label: "Dark", color: "#18181b", type: "background" },
  { value: "light", label: "Light", color: "#fafafa", type: "background" },
  { value: "midnight", label: "Midnight", color: "#020617", type: "background" },
  { value: "ocean", label: "Ocean", color: "#0f172a", type: "background" },
  { value: "purple", label: "Purple", color: "#1a0a2e", type: "background" },
  { value: "emerald", label: "Emerald", color: "#022c22", type: "background" },
  { value: "sapphire", label: "Sapphire", color: "#082f49", type: "background" },
  { value: "crimson", label: "Crimson", color: "#1a0505", type: "background" },
  { value: "rose", label: "Rose", color: "#1a0a0a", type: "background" },
  { value: "carbon", label: "Carbon", color: "#0a0a0a", type: "background" },
  { value: "silver", label: "Silver", color: "#1f1f1f", type: "background" },
  { value: "dracula", label: "Dracula", color: "#282a36", type: "background" },
  { value: "nord", label: "Nord", color: "#2e3440", type: "background" },
  { value: "sunset", label: "Sunset", color: "#1a0505", type: "background" },
  { value: "forest", label: "Forest", color: "#030f03", type: "background" },
  { value: "galaxy", label: "Galaxy", color: "#0a041a", type: "background" },
  { value: "aurora", label: "Aurora", color: "#04101a", type: "background" },
  { value: "custom", label: "Custom", color: "#18181b", type: "background" },
]

export const ACCENT_COLORS = [
  { value: "violet", label: "Violet", color: "#8b5cf6" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "green", label: "Green", color: "#22c55e" },
  { value: "red", label: "Red", color: "#ef4444" },
  { value: "orange", label: "Orange", color: "#f97316" },
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "teal", label: "Teal", color: "#14b8a6" },
  { value: "yellow", label: "Gold", color: "#eab308" },
  { value: "indigo", label: "Indigo", color: "#818cf8" },
  { value: "cyan", label: "Cyan", color: "#06b6d4" },
  { value: "amber", label: "Amber", color: "#f59e0b" },
  { value: "lime", label: "Lime", color: "#84cc16" },
]

export interface VisualSettings {
  theme: string
  accentColor: string
  background: string | null
  backgroundOverlay: boolean
  overlayDarkness: number
  overlayOpacity: number
  backgroundVisibility: number
  blur: number
  motionBlur: number
  transparency: number
  brightness: number
  contrast: number
  saturation: number
  scale: number
  textSize: "small" | "normal" | "large" | "xlarge"
  animationsEnabled: boolean
  cardTransparency: number
  interfaceScale: number
}

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
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

export interface BackgroundImage {
  id: string
  name: string
  url: string
  thumbnail: string
  isFavorite: boolean
  isActive: boolean
  createdAt: string
  fileSize: number
  width: number
  height: number
}

export type ExtendedUser = User & {
  id: string
  role: UserRole
}

export type PlanType = {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  currency: string
  interval: string
  durationDays: number
  features: string
  isPopular: boolean
  isActive: boolean
  sortOrder: number
}

export type LicenseType = {
  id: string
  licenseKey: string
  userId: string
  planId: string | null
  status: string
  startsAt: string
  expiresAt: string
  gracePeriodEnd: string | null
  activatedAt: string | null
  activatedOn: string | null
  hardwareId: string | null
  maxActivations: number
  activationCount: number
  isLifetime: boolean
  autoRenew: boolean
  renewalCount: number
  lastRenewedAt: string | null
  assignedRole: string
  notes: string | null
  plan?: PlanType | null
  user?: ExtendedUser
}

export type TicketType = {
  id: string
  userId: string
  subject: string
  message: string
  category: string | null
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  user?: ExtendedUser
  replies?: TicketReplyType[]
}

export type TicketReplyType = {
  id: string
  ticketId: string
  userId: string
  message: string
  isStaff: boolean
  createdAt: string
  user?: ExtendedUser
}

export type ThemeType = {
  id: string
  name: string
  description: string | null
  slug: string
  type: string
  isPublic: boolean
  config: string
  wallpaper: string | null
  background: string | null
  accentColor: string | null
  downloads: number
  rating: number
  user?: ExtendedUser
}

export type NotificationType = {
  id: string
  userId: string | null
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export type CouponType = {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
}

export type PaymentType = {
  id: string
  userId: string
  licenseId: string | null
  amount: number
  currency: string
  status: string
  method: string | null
  transactionId: string | null
  createdAt: string
  user?: ExtendedUser
  license?: LicenseType | null
}

export type AnalyticsType = {
  totalRevenue: number
  monthlyRevenue: number[]
  yearlyRevenue: number[]
  newCustomers: number
  activeCustomers: number
  expiredCustomers: number
  lifetimeCustomers: number
  totalLicenses: number
  activeLicenses: number
  expiredLicenses: number
  revenueByPlan: { name: string; revenue: number }[]
  topSellingPlans: { name: string; sales: number }[]
  recentPayments: PaymentType[]
  recentRegistrations: ExtendedUser[]
  recentActivations: LicenseType[]
  licenseStatusDistribution: { name: string; value: number }[]
}

export type DashboardStats = {
  totalRevenue: number
  revenueGrowth: number
  activeLicenses: number
  licenseGrowth: number
  totalCustomers: number
  customerGrowth: number
  pendingTickets: number
  ticketGrowth: number
  revenueData: { month: string; revenue: number }[]
  licenseData: { month: string; licenses: number }[]
  recentActivities: { action: string; details: string; createdAt: string }[]
}

export type OwnerDashboardStats = {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  activeLicenses: number
  expiredLicenses: number
  lifetimeLicenses: number
  dailyRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  totalRevenue: number
  newRegistrations: number
  connectedDevices: number
  recentActivity: { action: string; details: string; createdAt: string; user: string }[]
}
