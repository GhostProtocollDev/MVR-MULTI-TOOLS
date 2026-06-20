import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export function getRedirectUrl(role: string): string {
  const urls: Record<string, string> = {
    owner: "/owner",
    administrator: "/admin",
    moderator: "/moderator",
    reseller: "/reseller",
    user: "/dashboard",
    customer: "/dashboard",
  }
  return urls[role] || "/dashboard"
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        licenseKey: { label: "License Key", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password || !credentials?.licenseKey) return null

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          })

          if (!user || !user.password) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          const license = await prisma.license.findUnique({
            where: { licenseKey: credentials.licenseKey },
          })

          if (!license) return null
          if (license.status !== "active") return null

          if (license.userId !== user.id) {
            await prisma.license.update({
              where: { id: license.id },
              data: { userId: user.id },
            })
          }

          const role = license.assignedRole === "owner" ? "owner" : user.role

          await prisma.user.update({
            where: { id: user.id },
            data: { loginCount: { increment: 1 }, lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            email: user.email || `${user.username}@ghost.local`,
            image: user.image,
            role,
          }
        } catch (error) {
          console.error("[AUTH ERROR]", error)
          return null
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const googleEmail = profile?.email || user.email
          if (!googleEmail) return false

          // Check if user already exists with this google email
          let existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { googleEmail: googleEmail },
                { email: googleEmail },
              ],
            },
          })

          if (existingUser) {
            // Update googleEmail if not set
            if (!existingUser.googleEmail) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  googleEmail: googleEmail,
                  image: user.image || existingUser.image,
                  name: user.name || existingUser.name,
                  loginCount: { increment: 1 },
                  lastLoginAt: new Date(),
                },
              })
            } else {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  loginCount: { increment: 1 },
                  lastLoginAt: new Date(),
                  image: user.image || existingUser.image,
                },
              })
            }
            return true
          }

          // Auto-register new user
          const usernameBase = googleEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")
          let username = usernameBase
          let suffix = 1
          while (await prisma.user.findUnique({ where: { username } })) {
            username = usernameBase + suffix
            suffix++
          }

          await prisma.user.create({
            data: {
              username,
              email: googleEmail,
              googleEmail: googleEmail,
              name: user.name || username,
              image: user.image,
              role: "customer",
              emailVerified: new Date(),
              loginCount: 1,
              lastLoginAt: new Date(),
            },
          })

          await prisma.activityLog.create({
            data: {
              userId: null,
              action: "google_register",
              details: "New user registered via Google: " + googleEmail,
              ip: account.id_token || undefined,
            },
          })

          return true
        } catch (error) {
          console.error("[GOOGLE SIGNIN ERROR]", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as any
        return { ...token, id: u.id, username: u.username, role: u.role || "user" }
      }
      // Refresh role from DB periodically
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, googleEmail: true, banned: true },
          })
          if (dbUser) {
            if (dbUser.banned) return { ...token, role: "banned" }
            token.role = dbUser.role
            token.googleEmail = dbUser.googleEmail
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: (token as any)?.id,
          username: (token as any)?.username,
          role: (token as any)?.role,
          googleEmail: (token as any)?.googleEmail,
        },
      }
    },
  },
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function logActivity(
  userId: string | undefined,
  action: string,
  details?: string,
  ip?: string,
  userAgent?: string
) {
  await prisma.activityLog.create({
    data: { userId, action, details, ip, userAgent },
  })
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  licenseId?: string
) {
  await prisma.notification.create({
    data: { userId, type, title, message, licenseId },
  })
}
