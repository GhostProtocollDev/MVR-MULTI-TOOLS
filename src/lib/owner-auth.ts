import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { randomBytes, createHash } from "crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const HASH_ROUNDS = 12
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
const GHOST_PREFIX = "GHOST"
const LICENSE_SEGMENTS = [5, 4, 4, 4, 4] as const

export function generateOwnerLicenseKey(): string {
  const segment = (len: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let s = ""
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return s
  }
  return LICENSE_SEGMENTS.map((len) => segment(len)).join("-")
}

export function validateOwnerLicenseFormat(key: string): boolean {
  const pattern = /^GHOST-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return pattern.test(key)
}

export async function hashOwnerLicense(key: string): Promise<string> {
  return bcrypt.hash(key, HASH_ROUNDS)
}

export async function verifyOwnerLicense(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}

export async function hashOwnerPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS)
}

export async function verifyOwnerPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken(): string {
  return randomBytes(48).toString("hex")
}

export async function initializeOwnerAccount(): Promise<boolean> {
  const licenseKey = process.env.OWNER_LICENSE
  const username = process.env.OWNER_USERNAME
  const password = process.env.OWNER_PASSWORD

  if (!licenseKey || !username || !password) {
    console.warn("[OWNER] Missing environment variables for owner initialization")
    return false
  }

  if (!validateOwnerLicenseFormat(licenseKey)) {
    console.error("[OWNER] Invalid owner license format. Expected GHOST-XXXX-XXXX-XXXX-XXXX")
    return false
  }

  const existing = await prisma.ownerLicense.findFirst()
  if (existing) {
    return false
  }

  const licenseHash = await hashOwnerLicense(licenseKey)
  const passwordHash = await hashOwnerPassword(password)

  await prisma.ownerLicense.create({
    data: {
      licenseKey,
      licenseHash,
      username,
      passwordHash,
      isActive: true,
      isLifetime: true,
    },
  })

  await prisma.ownerAuditLog.create({
    data: {
      ownerId: "", // Will be updated after creation - use find
      action: "OWNER_INITIALIZED",
      details: "Owner account created on first deployment",
    },
  })

  // Update the audit log with the actual owner ID
  const owner = await prisma.ownerLicense.findFirst({ where: { username } })
  if (owner) {
    await prisma.ownerAuditLog.updateMany({
      where: { ownerId: "" },
      data: { ownerId: owner.id },
    })
  }

  return true
}

export async function authenticateOwner(
  username: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<{ success: boolean; token?: string; reason?: string }> {
  const owner = await prisma.ownerLicense.findUnique({ where: { username } })

  if (!owner) {
    return { success: false, reason: "Invalid credentials" }
  }

  if (!owner.isActive) {
    return { success: false, reason: "Account disabled" }
  }

  const validPassword = await verifyOwnerPassword(password, owner.passwordHash)
  if (!validPassword) {
    await prisma.ownerAuditLog.create({
      data: {
        ownerId: owner.id,
        action: "LOGIN_FAILED",
        details: "Invalid password attempt",
        ip,
        userAgent,
      },
    })
    return { success: false, reason: "Invalid credentials" }
  }

  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.ownerSession.create({
    data: {
      ownerId: owner.id,
      token,
      ip,
      userAgent,
      isActive: true,
      expiresAt,
    },
  })

  await prisma.ownerLicense.update({
    where: { id: owner.id },
    data: { lastUsedAt: new Date() },
  })

  await prisma.ownerAuditLog.create({
    data: {
      ownerId: owner.id,
      action: "LOGIN_SUCCESS",
      details: "Owner authenticated successfully",
      ip,
      userAgent,
    },
  })

  return { success: true, token }
}

export async function validateOwnerSession(
  token: string
): Promise<{ valid: boolean; owner?: any }> {
  const session = await prisma.ownerSession.findUnique({
    where: { token },
    include: { owner: true },
  })

  if (!session) return { valid: false }
  if (!session.isActive) return { valid: false }
  if (!session.owner.isActive) return { valid: false }
  if (new Date() > session.expiresAt) {
    await prisma.ownerSession.update({
      where: { id: session.id },
      data: { isActive: false },
    })
    return { valid: false }
  }

  await prisma.ownerSession.update({
    where: { id: session.id },
    data: { lastUsed: new Date() },
  })

  return {
    valid: true,
    owner: {
      id: session.owner.id,
      username: session.owner.username,
      licenseKey: session.owner.licenseKey,
      isLifetime: session.owner.isLifetime,
      lastRotatedAt: session.owner.lastRotatedAt,
    },
  }
}

export async function rotateOwnerLicense(
  ownerId: string,
  currentLicense: string,
  newLicense: string,
  ip?: string,
  userAgent?: string
): Promise<{ success: boolean; reason?: string; newKey?: string }> {
  const owner = await prisma.ownerLicense.findUnique({ where: { id: ownerId } })
  if (!owner) return { success: false, reason: "Owner not found" }

  if (!validateOwnerLicenseFormat(newLicense)) {
    return { success: false, reason: "Invalid new license format. Use GHOST-XXXX-XXXX-XXXX-XXXX" }
  }

  const validCurrent = await verifyOwnerLicense(currentLicense, owner.licenseHash)
  if (!validCurrent) {
    await prisma.ownerAuditLog.create({
      data: { ownerId, action: "ROTATE_FAILED", details: "Invalid current license", ip, userAgent },
    })
    return { success: false, reason: "Current license is invalid" }
  }

  const newHash = await hashOwnerLicense(newLicense)

  await prisma.ownerLicense.update({
    where: { id: ownerId },
    data: { licenseKey: newLicense, licenseHash: newHash, lastRotatedAt: new Date() },
  })

  await prisma.ownerAuditLog.create({
    data: { ownerId, action: "LICENSE_ROTATED", details: "Owner license key rotated", ip, userAgent },
  })

  return { success: true, newKey: newLicense }
}

export async function replaceOwnerLicense(
  ownerId: string,
  newLicense: string,
  ip?: string,
  userAgent?: string
): Promise<{ success: boolean; reason?: string }> {
  if (!validateOwnerLicenseFormat(newLicense)) {
    return { success: false, reason: "Invalid license format. Use GHOST-XXXX-XXXX-XXXX-XXXX" }
  }

  const existing = await prisma.ownerLicense.findFirst({ where: { licenseKey: newLicense } })
  if (existing && existing.id !== ownerId) {
    return { success: false, reason: "License key already in use" }
  }

  const newHash = await hashOwnerLicense(newLicense)

  await prisma.ownerLicense.update({
    where: { id: ownerId },
    data: { licenseKey: newLicense, licenseHash: newHash, lastRotatedAt: new Date() },
  })

  await prisma.ownerAuditLog.create({
    data: { ownerId, action: "LICENSE_REPLACED", details: "Owner license replaced", ip, userAgent },
  })

  return { success: true }
}

export async function initiateOwnerRecovery(
  username: string
): Promise<{ success: boolean; message: string }> {
  const owner = await prisma.ownerLicense.findUnique({ where: { username } })
  if (!owner) {
    return { success: true, message: "If the account exists, recovery instructions have been logged" }
  }

  await prisma.ownerAuditLog.create({
    data: {
      ownerId: owner.id,
      action: "RECOVERY_REQUESTED",
      details: "Owner recovery process initiated",
    },
  })

  // Recovery code is logged to the audit log (in production, send via out-of-band channel)
  const recoveryCode = randomBytes(4).toString("hex").toUpperCase()

  await prisma.ownerAuditLog.create({
    data: {
      ownerId: owner.id,
      action: "RECOVERY_CODE_GENERATED",
      details: `Recovery code: ${recoveryCode} (USE ONCE, EXPIRES IN 30 MIN)`,
    },
  })

  return {
    success: true,
    message: "Recovery instructions have been logged. Check the owner audit log for your recovery code.",
  }
}

export async function executeOwnerRecovery(
  recoveryCode: string,
  newLicense: string,
  newPassword: string,
  ip?: string,
  userAgent?: string
): Promise<{ success: boolean; reason?: string }> {
  // In production, validate the recovery code against what was stored
  // For this implementation, the recovery code must match a valid pattern
  if (!recoveryCode || recoveryCode.length < 4) {
    return { success: false, reason: "Invalid recovery code" }
  }

  if (!validateOwnerLicenseFormat(newLicense)) {
    return { success: false, reason: "Invalid license format" }
  }

  // Find the most recent recovery request
  const recentRecovery = await prisma.ownerAuditLog.findFirst({
    where: { action: "RECOVERY_CODE_GENERATED", details: { contains: recoveryCode } },
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  })

  if (!recentRecovery) {
    return { success: false, reason: "Invalid recovery code" }
  }

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  if (recentRecovery.createdAt < thirtyMinAgo) {
    return { success: false, reason: "Recovery code expired" }
  }

  const owner = recentRecovery.owner
  const newLicenseHash = await hashOwnerLicense(newLicense)
  const newPasswordHash = await hashOwnerPassword(newPassword)

  await prisma.ownerLicense.update({
    where: { id: owner.id },
    data: {
      licenseKey: newLicense,
      licenseHash: newLicenseHash,
      passwordHash: newPasswordHash,
      lastRotatedAt: new Date(),
    },
  })

  // Invalidate all existing sessions
  await prisma.ownerSession.updateMany({
    where: { ownerId: owner.id, isActive: true },
    data: { isActive: false },
  })

  await prisma.ownerAuditLog.create({
    data: {
      ownerId: owner.id,
      action: "RECOVERY_COMPLETED",
      details: "Emergency owner recovery completed. All sessions invalidated.",
      ip,
      userAgent,
    },
  })

  return { success: true }
}

export async function terminateOwnerSession(
  sessionId: string,
  ownerId: string
): Promise<boolean> {
  const session = await prisma.ownerSession.findFirst({
    where: { id: sessionId, ownerId },
  })
  if (!session) return false

  await prisma.ownerSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  })

  await prisma.ownerAuditLog.create({
    data: {
      ownerId,
      action: "SESSION_TERMINATED",
      details: `Session ${sessionId} terminated`,
    },
  })

  return true
}

export async function getAuthenticatedOwner(req: any) {
  const token = req.cookies?.get("owner_token")?.value
  if (token) {
    const result = await validateOwnerSession(token)
    if (result.valid) return result.owner
  }
  const session = await getServerSession(authOptions)
  if (session?.user && (session.user as any).role === "owner") {
    return {
      id: (session.user as any).id,
      username: (session.user as any).username,
      isNextAuth: true,
    }
  }
  return null
}

export async function terminateAllOwnerSessions(
  ownerId: string,
  excludeToken?: string
): Promise<void> {
  const where: any = { ownerId, isActive: true }
  if (excludeToken) {
    where.token = { not: excludeToken }
  }

  await prisma.ownerSession.updateMany({
    where,
    data: { isActive: false },
  })

  await prisma.ownerAuditLog.create({
    data: {
      ownerId,
      action: "ALL_SESSIONS_TERMINATED",
      details: "All active sessions terminated",
    },
  })
}
