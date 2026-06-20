'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Avatar } from "@/components/ui"
import { cn } from "@/lib/utils"

const accountNav = [
  { icon: "👤", label: "Profile", href: "/account" },
  { icon: "🔑", label: "My Licenses", href: "/account/licenses" },
  { icon: "💳", label: "Billing", href: "/account/billing" },
  { icon: "📥", label: "Downloads", href: "/account/downloads" },
  { icon: "🎫", label: "Support", href: "/account/support" },
  { icon: "🔔", label: "Notifications", href: "/account/notifications" },
  { icon: "🛡️", label: "Security", href: "/account/security" },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold">GHOST</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-destructive transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-muted/30">
              <Avatar src={session?.user?.image} name={session?.user?.name} size="md" />
              <div>
                <div className="font-medium text-sm">{session?.user?.name}</div>
                <div className="text-xs text-muted-foreground">Customer</div>
              </div>
            </div>
            <nav className="space-y-1">
              {accountNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
