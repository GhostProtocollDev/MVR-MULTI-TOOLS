'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from "@/components/ui"
import { ROLES, getRoleColor, getRoleLabel } from "@/types"
import toast from "react-hot-toast"

const PERMISSIONS = [
  { id: "manage_users", label: "Manage Users" },
  { id: "manage_licenses", label: "Manage Licenses" },
  { id: "manage_pricing", label: "Manage Pricing" },
  { id: "manage_themes", label: "Manage Themes" },
  { id: "manage_roles", label: "Manage Roles" },
  { id: "view_analytics", label: "View Analytics" },
  { id: "view_audit", label: "View Audit Logs" },
  { id: "manage_security", label: "Manage Security" },
  { id: "manage_support", label: "Manage Support" },
  { id: "manage_coupons", label: "Manage Coupons" },
  { id: "manage_announcements", label: "Manage Announcements" },
  { id: "manage_settings", label: "Manage Settings" },
  { id: "ban_users", label: "Ban Users" },
  { id: "delete_users", label: "Delete Users" },
]

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  owner: PERMISSIONS.map((p) => p.id),
  administrator: ["manage_users", "manage_licenses", "manage_pricing", "manage_themes", "view_analytics", "view_audit", "manage_support", "manage_coupons", "manage_announcements", "manage_settings"],
  moderator: ["manage_licenses", "manage_themes", "manage_support", "view_analytics"],
  reseller: ["manage_licenses", "view_analytics"],
  user: [],
}

export default function RolesPage() {
  const [perms, setPerms] = useState<Record<string, string[]>>(DEFAULT_PERMISSIONS)

  function togglePermission(role: string, permId: string) {
    const current = perms[role] || []
    const updated = current.includes(permId)
      ? current.filter((p) => p !== permId)
      : [...current, permId]
    setPerms({ ...perms, [role]: updated })
  }

  function isOwnerRole(role: string) {
    return role === "owner"
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Manager</h1>
        <p className="text-muted-foreground mt-1">Configure permissions for each role</p>
      </div>

      <div className="space-y-6">
        {ROLES.map((role) => (
          <Card key={role.value}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <h3 className="font-bold text-lg">{role.label}</h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ backgroundColor: `${role.color}20`, color: role.color }}
                >
                  {role.value}
                </span>
              </div>
              {isOwnerRole(role.value) && (
                <Badge variant="warning">Full Access</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {PERMISSIONS.map((perm) => {
                const enabled = perms[role.value]?.includes(perm.id) || false
                return (
                  <button
                    key={perm.id}
                    onClick={() => {
                      if (isOwnerRole(role.value)) {
                        toast.error("Owner permissions cannot be modified")
                        return
                      }
                      togglePermission(role.value, perm.id)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      enabled
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/50 text-muted-foreground border border-transparent hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                    {perm.label}
                  </button>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
