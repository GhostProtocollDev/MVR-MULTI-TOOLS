import { prisma } from "@/lib/prisma"

export interface LicenseInfo {
  id: string
  licenseKey: string
  status: string
  expiresAt: Date | null
  isLifetime: boolean
  planName: string | null
  activationCount: number
  maxActivations: number
  user: {
    id: string
    username: string
    name: string | null
    role: string
  }
}

export async function getUserLicense(userId: string): Promise<LicenseInfo | null> {
  const license = await prisma.license.findFirst({
    where: { userId },
    include: { user: { select: { id: true, username: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  })
  if (!license) return null
  return {
    id: license.id,
    licenseKey: license.licenseKey,
    status: license.status,
    expiresAt: license.expiresAt,
    isLifetime: license.isLifetime,
    planName: null,
    activationCount: license.activationCount,
    maxActivations: license.maxActivations,
    user: license.user,
  }
}
