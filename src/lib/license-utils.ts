export type LicenseType = "owner" | "lifetime" | "temporary"

export function getLicenseType(license: { isLifetime: boolean; user?: { role: string } }): LicenseType {
  if (license.user?.role === "owner") return "owner"
  if (license.isLifetime) return "lifetime"
  return "temporary"
}

export function getLicenseDaysRemaining(expiresAt: Date | string | null): number | null {
  if (!expiresAt) return null
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getLicenseHoursRemaining(expiresAt: Date | string | null): number | null {
  if (!expiresAt) return null
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60))
}

export function getLicenseColor(license: {
  user?: { role: string }
  isLifetime?: boolean
  expiresAt?: Date | string | null
  status?: string
}): string {
  if (license.user?.role === "owner") return "#FFD700"
  if (license.isLifetime) return "#FFD700"
  const days = getLicenseDaysRemaining(license.expiresAt ?? null)
  if (days === null || license.status === "expired" || (days !== null && days <= 0)) return "#6B7280"
  if (days <= 3) return "#EF4444"
  if (days <= 7) return "#F97316"
  if (days <= 30) return "#EAB308"
  return "#22C55E"
}

export function getLicenseBg(license: {
  user?: { role: string }
  isLifetime?: boolean
  expiresAt?: Date | string | null
  status?: string
}): string {
  if (license.user?.role === "owner") return "rgba(255,215,0,0.1)"
  if (license.isLifetime) return "rgba(255,215,0,0.1)"
  const days = getLicenseDaysRemaining(license.expiresAt ?? null)
  if (days === null || license.status === "expired" || (days !== null && days <= 0)) return "rgba(107,114,128,0.12)"
  if (days <= 3) return "rgba(239,68,68,0.12)"
  if (days <= 7) return "rgba(249,115,22,0.12)"
  if (days <= 30) return "rgba(234,179,8,0.12)"
  return "rgba(34,197,94,0.12)"
}

export function getLicenseBorder(license: {
  user?: { role: string }
  isLifetime?: boolean
  expiresAt?: Date | string | null
  status?: string
}): string {
  if (license.user?.role === "owner") return "rgba(255,215,0,0.3)"
  if (license.isLifetime) return "rgba(255,215,0,0.3)"
  const days = getLicenseDaysRemaining(license.expiresAt ?? null)
  if (days === null || license.status === "expired" || (days !== null && days <= 0)) return "rgba(107,114,128,0.3)"
  if (days <= 3) return "rgba(239,68,68,0.3)"
  if (days <= 7) return "rgba(249,115,22,0.3)"
  if (days <= 30) return "rgba(234,179,8,0.3)"
  return "rgba(34,197,94,0.3)"
}

export function getLicenseLabel(license: {
  user?: { role: string }
  isLifetime?: boolean
  expiresAt?: Date | string | null
  status?: string
}): string {
  if (license.user?.role === "owner") return "OWNER"
  if (license.isLifetime) return "LIFETIME"
  if (license.status === "expired") return "EXPIRED"
  const days = getLicenseDaysRemaining(license.expiresAt ?? null)
  if (days === null) return "FREE"
  if (days <= 0) return "EXPIRED"
  if (days <= 3) return "CRITICAL"
  if (days <= 7) return "WARNING"
  return "ACTIVE"
}
