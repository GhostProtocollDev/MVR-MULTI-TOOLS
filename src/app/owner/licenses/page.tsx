'use client'

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Badge, Input, Modal, Spinner } from "@/components/ui"
import { getLicenseColor, getLicenseBg, getLicenseLabel } from "@/lib/license-utils"

interface LicenseUser {
  id: string
  username: string
  name: string | null
  email: string | null
  role: string
}

interface LicensePlan {
  id: string
  name: string
}

interface License {
  id: string
  licenseKey: string
  userId: string
  planId: string | null
  status: string
  startsAt: string
  expiresAt: string
  isLifetime: boolean
  activationCount: number
  maxActivations: number
  autoRenew: boolean
  renewalCount: number
  lastRenewedAt: string | null
  createdAt: string
  updatedAt: string
  user: LicenseUser
  plan: LicensePlan | null
}

interface LicenseStats {
  total: number
  active: number
  expired: number
  expiringSoon: number
  lifetime: number
  admins: number
  resellers: number
  users: number
}

type SortField = "licenseKey" | "status" | "expiresAt" | "createdAt" | "user.username" | "activationCount"
type SortDir = "asc" | "desc"
type ModalType = "extend" | "convert" | "reduce" | "transfer" | "revoke" | "role" | "suspend" | "reactivate" | "history" | null

const INITIAL_STATS: LicenseStats = {
  total: 0, active: 0, expired: 0, expiringSoon: 0,
  lifetime: 0, admins: 0, resellers: 0, users: 0,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 365) return `${Math.floor(days / 365)}y ago`
  if (days > 30) return `${Math.floor(days / 30)}mo ago`
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h ago`
  return "just now"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function getDaysLeft(expiresAt: string, isLifetime: boolean): number | null {
  if (isLifetime) return null
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
}

function getStatusColor(days: number | null, isLifetime: boolean, status: string): string {
  if (isLifetime) return "#FFD700"
  if (status !== "active") return "#6B7280"
  if (days === null) return "#22C55E"
  if (days <= 0) return "#6B7280"
  if (days <= 3) return "#EF4444"
  if (days <= 7) return "#F97316"
  if (days <= 30) return "#EAB308"
  return "#22C55E"
}

function getStatusBg(days: number | null, isLifetime: boolean, status: string): string {
  if (isLifetime) return "rgba(255,215,0,0.1)"
  if (status !== "active") return "rgba(107,114,128,0.1)"
  if (days === null) return "rgba(34,197,94,0.1)"
  if (days <= 0) return "rgba(107,114,128,0.1)"
  if (days <= 3) return "rgba(239,68,68,0.1)"
  if (days <= 7) return "rgba(249,115,22,0.1)"
  if (days <= 30) return "rgba(234,179,8,0.1)"
  return "rgba(34,197,94,0.1)"
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    owner: { color: "#FFD700", bg: "rgba(255,215,0,0.15)" },
    admin: { color: "#A78BFA", bg: "rgba(167,139,250,0.15)" },
    reseller: { color: "#60A5FA", bg: "rgba(96,165,250,0.15)" },
    customer: { color: "#34D399", bg: "rgba(52,211,153,0.15)" },
  }
  const s = styles[role] || { color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {role}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div
      initial={false}
      className="rounded-xl border p-4 flex flex-col"
      style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
    >
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${color}99` }}>{label}</span>
      <span className="text-2xl font-bold mt-1" style={{ color }}>{value}</span>
    </motion.div>
  )
}

export default function OwnerLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [stats, setStats] = useState<LicenseStats>(INITIAL_STATS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [extendDays, setExtendDays] = useState(30)
  const [reduceDays, setReduceDays] = useState(1)
  const [transferUsername, setTransferUsername] = useState("")
  const [transferResults, setTransferResults] = useState<LicenseUser[]>([])
  const [newRole, setNewRole] = useState("customer")
  const [historyEntries, setHistoryEntries] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchLicenses = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/licenses")
      if (!res.ok) return
      const data = await res.json()
      setLicenses(data.licenses || [])
      setStats(data.stats || INITIAL_STATS)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const filtered = licenses
    .filter((l) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        l.licenseKey.toLowerCase().includes(q) ||
        l.user.username.toLowerCase().includes(q) ||
        (l.user.name || "").toLowerCase().includes(q) ||
        (l.user.email || "").toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === "licenseKey") cmp = a.licenseKey.localeCompare(b.licenseKey)
      else if (sortField === "status") cmp = a.status.localeCompare(b.status)
      else if (sortField === "expiresAt") cmp = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      else if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else if (sortField === "user.username") cmp = a.user.username.localeCompare(b.user.username)
      else if (sortField === "activationCount") cmp = a.activationCount - b.activationCount
      return sortDir === "asc" ? cmp : -cmp
    })

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function openModal(type: ModalType, license: License) {
    setSelectedLicense(license)
    setModal(type)
    setActionMessage(null)
    setTransferResults([])
    setTransferUsername("")
    if (type === "extend") setExtendDays(30)
    if (type === "reduce") setReduceDays(1)
    if (type === "role") setNewRole(license.user.role)
    if (type === "history") fetchHistory(license.id)
  }

  async function performAction(data: Record<string, any>) {
    if (!selectedLicense || !modal) return
    setActionLoading(true)
    setActionMessage(null)
    try {
      const res = await fetch("/api/owner/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionMap[modal], licenseId: selectedLicense.id, ...data }),
      })
      const result = await res.json()
      if (res.ok) {
        setActionMessage({ type: "success", text: result.message || "Done" })
        setTimeout(() => {
          setModal(null)
          fetchLicenses()
        }, 1000)
      } else {
        setActionMessage({ type: "error", text: result.error || "Failed" })
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" })
    } finally {
      setActionLoading(false)
    }
  }

  async function searchTransferUser() {
    if (transferUsername.length < 2) return
    try {
      const res = await fetch(`/api/owner/users-search?q=${encodeURIComponent(transferUsername)}`)
      const data = await res.json()
      setTransferResults(data.users || [])
    } catch { /* silent */ }
  }

  async function fetchHistory(licenseId: string) {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/licenses/history?licenseId=${licenseId}&limit=100`)
      const data = await res.json()
      setHistoryEntries(data.history || [])
    } catch {
      setHistoryEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">License Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage all licenses with full control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs" onClick={fetchLicenses} loading={loading}>
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total" value={stats.total} color="#FFFFFF" />
        <StatCard label="Active" value={stats.active} color="#22C55E" />
        <StatCard label="Expired" value={stats.expired} color="#6B7280" />
        <StatCard label="Expiring" value={stats.expiringSoon} color="#F97316" />
        <StatCard label="Lifetime" value={stats.lifetime} color="#FFD700" />
        <StatCard label="Admins" value={stats.admins} color="#A78BFA" />
        <StatCard label="Resellers" value={stats.resellers} color="#60A5FA" />
        <StatCard label="Users" value={stats.users} color="#34D399" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search by key, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <span className="text-xs text-zinc-500">{filtered.length} of {licenses.length}</span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <p className="text-zinc-400 text-sm">{search ? "No licenses match your search" : "No licenses found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <Th sortable field="user.username" current={sortField} dir={sortDir} onClick={toggleSort}>User</Th>
                  <Th sortable field="licenseKey" current={sortField} dir={sortDir} onClick={toggleSort}>License Key</Th>
                  <Th>Role</Th>
                  <Th sortable field="status" current={sortField} dir={sortDir} onClick={toggleSort}>Status</Th>
                  <Th sortable field="expiresAt" current={sortField} dir={sortDir} onClick={toggleSort}>Expires</Th>
                  <Th>Remaining</Th>
                  <Th sortable field="activationCount" current={sortField} dir={sortDir} onClick={toggleSort}>Devices</Th>
                  <Th sortable field="createdAt" current={sortField} dir={sortDir} onClick={toggleSort}>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((license) => {
                  const days = getDaysLeft(license.expiresAt, license.isLifetime)
                  const color = getStatusColor(days, license.isLifetime, license.status)
                  const bg = getStatusBg(days, license.isLifetime, license.status)
                  return (
                    <tr key={license.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-white font-medium">{license.user.name || license.user.username}</span>
                          <span className="text-xs text-zinc-500">{license.user.email || license.user.username}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <code className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded">{license.licenseKey.slice(0, 19)}...</code>
                      </td>
                      <td className="p-3"><RoleBadge role={license.user.role} /></td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ color, backgroundColor: bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {license.isLifetime ? "LIFETIME" : license.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-zinc-400">
                        {license.isLifetime ? <span className="text-yellow-400">—</span> : formatDate(license.expiresAt)}
                      </td>
                      <td className="p-3">
                        {license.isLifetime ? (
                          <span className="text-[11px] font-semibold text-yellow-400">∞</span>
                        ) : days !== null && days > 0 ? (
                          <span className="text-sm font-medium" style={{ color }}>{days}d</span>
                        ) : (
                          <span className="text-sm text-zinc-500">Expired</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-zinc-400">
                        {license.activationCount}/{license.maxActivations}
                      </td>
                      <td className="p-3 text-sm text-zinc-500">{timeAgo(license.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <ActionBtn label="History" color="#818CF8" onClick={() => openModal("history", license)} />
                          <ActionBtn label="Extend" color="#22C55E" onClick={() => openModal("extend", license)} />
                          {!license.isLifetime && <ActionBtn label="Lifetime" color="#FFD700" onClick={() => openModal("convert", license)} />}
                          <ActionBtn label="Reduce" color="#F97316" onClick={() => openModal("reduce", license)} />
                          <ActionBtn label="Role" color="#A78BFA" onClick={() => openModal("role", license)} />
                          <ActionBtn label="Transfer" color="#60A5FA" onClick={() => openModal("transfer", license)} />
                          {license.status === "active" && <ActionBtn label="Suspend" color="#F97316" onClick={() => openModal("suspend", license)} />}
                          {license.status === "suspended" && <ActionBtn label="Reactivate" color="#22C55E" onClick={() => openModal("reactivate", license)} />}
                          <ActionBtn label="Revoke" color="#EF4444" onClick={() => openModal("revoke", license)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modalTitle(modal, selectedLicense)}>
        <div className="space-y-4">
          {actionMessage && (
            <div className={`text-sm px-3 py-2 rounded-lg ${actionMessage.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {actionMessage.text}
            </div>
          )}

          {modal === "extend" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Extend this license by:</p>
              <div className="flex gap-2">
                {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setExtendDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${extendDays === d ? "bg-primary/20 text-primary border border-primary/30" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                  >
                    {d >= 365 ? `${d / 365}y` : `${d}d`}
                  </button>
                ))}
              </div>
              <Input label="Custom days" type="number" min={1} value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} />
            </div>
          )}

          {modal === "reduce" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Reduce this license by (days):</p>
              <Input type="number" min={1} value={reduceDays} onChange={(e) => setReduceDays(Number(e.target.value))} />
            </div>
          )}

          {modal === "convert" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Convert <span className="text-yellow-400 font-semibold">{selectedLicense?.licenseKey.slice(0, 19)}...</span> to a lifetime license?</p>
              <p className="text-xs text-zinc-500">This action will set <code className="text-zinc-300">expiresAt</code> to 2099-12-31 and mark it as lifetime. It can be undone.</p>
            </div>
          )}

          {modal === "transfer" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Transfer <span className="text-blue-400 font-semibold">{selectedLicense?.licenseKey.slice(0, 19)}...</span> to another user:</p>
              <Input label="Search username or email" value={transferUsername} onChange={(e) => { setTransferUsername(e.target.value); if (e.target.value.length >= 2) searchTransferUser() }} />
              {transferResults.length > 0 && (
                <div className="border border-zinc-800 rounded-lg max-h-40 overflow-y-auto">
                  {transferResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => performAction({ targetUserId: u.id })}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0"
                    >
                      <span className="text-sm text-white">{u.name || u.username}</span>
                      <span className="text-xs text-zinc-500 ml-2">({u.email || u.username})</span>
                      <RoleBadge role={u.role} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {modal === "role" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Change role for <span className="font-semibold">{selectedLicense?.user.username}</span>:</p>
              <div className="flex gap-2">
                {["customer", "reseller", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setNewRole(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newRole === r ? "bg-primary/20 text-primary border border-primary/30" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {modal === "revoke" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Revoke <span className="text-red-400 font-semibold">{selectedLicense?.licenseKey.slice(0, 19)}...</span>?</p>
              <p className="text-xs text-zinc-500">The license will be marked as expired and the user will lose access immediately.</p>
            </div>
          )}

          {modal === "suspend" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Suspend <span className="text-orange-400 font-semibold">{selectedLicense?.licenseKey.slice(0, 19)}...</span>?</p>
              <p className="text-xs text-zinc-500">The license will be suspended. The user can be reactivated later.</p>
            </div>
          )}

          {modal === "reactivate" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Reactivate <span className="text-green-400 font-semibold">{selectedLicense?.licenseKey.slice(0, 19)}...</span>?</p>
              <p className="text-xs text-zinc-500">The license status will be set to active.</p>
            </div>
          )}

          {modal === "history" && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : historyEntries.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No history entries found</p>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-zinc-800 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left p-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                        <th className="text-left p-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Details</th>
                        <th className="text-right p-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyEntries.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="p-2">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                              style={{
                                color: entry.action.includes("fail") ? "#EF4444" : entry.action.includes("suspend") ? "#F97316" : entry.action.includes("reactivate") || entry.action.includes("activate") ? "#22C55E" : entry.action === "revoke" ? "#EF4444" : "#818CF8",
                                backgroundColor: entry.action.includes("fail") ? "rgba(239,68,68,0.1)" : entry.action.includes("suspend") ? "rgba(249,115,22,0.1)" : entry.action.includes("reactivate") || entry.action.includes("activate") ? "rgba(34,197,94,0.1)" : entry.action === "revoke" ? "rgba(239,68,68,0.1)" : "rgba(129,140,248,0.1)",
                              }}
                            >
                              {entry.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2 text-xs text-zinc-400 max-w-[200px] truncate">{entry.details || "—"}</td>
                          <td className="p-2 text-xs text-zinc-500 text-right whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {modal && modal !== "transfer" && modal !== "history" && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</Button>
              <Button
                variant={modal === "revoke" || modal === "suspend" ? "danger" : "primary"}
                loading={actionLoading}
                onClick={() => {
                  if (modal === "extend") performAction({ days: extendDays })
                  else if (modal === "convert") performAction({})
                  else if (modal === "reduce") performAction({ days: reduceDays })
                  else if (modal === "role") performAction({ role: newRole })
                  else if (modal === "suspend") performAction({})
                  else if (modal === "reactivate") performAction({})
                  else if (modal === "revoke") performAction({})
                }}
              >
                {modal === "extend" ? `Extend ${extendDays}d` :
                 modal === "convert" ? "Convert to Lifetime" :
                 modal === "reduce" ? `Reduce ${reduceDays}d` :
                 modal === "role" ? "Change Role" :
                 modal === "suspend" ? "Suspend" :
                 modal === "reactivate" ? "Reactivate" :
                 "Revoke"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* Sub-components */

function Th({ children, sortable, field, current, dir, onClick }: {
  children: React.ReactNode
  sortable?: boolean
  field?: SortField
  current?: SortField
  dir?: SortDir
  onClick?: (f: SortField) => void
}) {
  const isActive = sortable && field === current
  return (
    <th
      className={`text-left p-3 text-xs font-medium ${sortable ? "cursor-pointer hover:text-zinc-300 select-none" : "text-zinc-500"} transition-colors`}
      onClick={() => sortable && field && onClick?.(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortable && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: isActive ? 1 : 0.3 }}>
            {isActive && dir === "asc" ? <path d="M12 5v14M5 12l7-7 7 7"/> : <path d="M12 19V5M5 12l7 7 7-7"/>}
          </svg>
        )}
      </span>
    </th>
  )
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="text-[11px] px-2 py-1 rounded-md font-medium transition-all duration-150 hover:scale-105"
      style={{ color, backgroundColor: `${color}15` }}
    >
      {label}
    </button>
  )
}

const actionMap: Record<string, string> = {
  extend: "extend",
  convert: "convert-lifetime",
  reduce: "reduce",
  transfer: "transfer",
  role: "change-role",
  suspend: "suspend",
  reactivate: "reactivate",
  revoke: "revoke",
}

function modalTitle(modal: ModalType, license: License | null): string {
  if (!license) return ""
  const map: Record<string, string> = {
    extend: `Extend License`,
    convert: `Convert to Lifetime`,
    reduce: `Reduce Time`,
    transfer: `Transfer License`,
    role: `Change User Role`,
    suspend: `Suspend License`,
    reactivate: `Reactivate License`,
    history: `License History`,
    revoke: `Revoke License`,
  }
  return map[modal || ""] || ""
}
