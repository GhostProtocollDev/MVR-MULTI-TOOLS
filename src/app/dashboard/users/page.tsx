'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, Badge, Avatar, Button, Input, Modal } from "@/components/ui"
import { getRoleColor, getRoleLabel } from "@/types"
import toast from "react-hot-toast"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editRole, setEditRole] = useState("")
  const [showBanConfirm, setShowBanConfirm] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("permanent")
  const [banning, setBanning] = useState(false)

  useEffect(() => {
    fetch("/api/owner/users-search")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  function openBanModal(user: any) {
    setSelectedUser(user)
    setBanReason("")
    setBanDuration("permanent")
    setShowBanConfirm(true)
  }

  async function handleBan() {
    if (!selectedUser) return
    setBanning(true)
    try {
      const res = await fetch("/api/owner/users-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "ban",
          reason: banReason || undefined,
          duration: banDuration,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`${selectedUser.username} has been banned`)
      setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, banned: true } : u))
      setShowBanConfirm(false)
      setSelectedUser(null)
    } catch {
      toast.error("Failed to ban user")
    } finally {
      setBanning(false)
    }
  }

  async function handleUnban(userId: string) {
    try {
      const res = await fetch("/api/owner/users-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "unban" }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("User unbanned")
      setUsers(users.map((u) => u.id === userId ? { ...u, banned: false } : u))
    } catch {
      toast.error("Failed to unban user")
    }
  }

  async function handleUpdateRole() {
    if (!selectedUser) return
    try {
      const res = await fetch("/api/owner/users-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, newRole: editRole }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Role updated")
      setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, role: editRole } : u))
      setShowEdit(false)
    } catch {
      toast.error("Failed to update role")
    }
  }

  const durationOptions = [
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "permanent", label: "Permanent" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Manage all registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{users.length} users</span>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rol</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Licencias</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registro</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name || user.username} size="sm" />
                        <div>
                          <div className="text-sm font-medium">{user.name || user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email || user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{ backgroundColor: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role) }}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{user._count?.licenses || 0}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.banned ? "danger" : "success"}>
                        {user.banned ? "Banned" : "Active"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedUser(user); setEditRole(user.role); setShowEdit(true) }}
                        >
                          Edit
                        </Button>
                        {user.banned ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnban(user.id)}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openBanModal(user)}
                          >
                            Ban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit User: ${selectedUser?.username}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="input-premium w-full"
            >
              <option value="user">User</option>
              <option value="reseller">Reseller</option>
              <option value="moderator">Moderator</option>
              <option value="administrator">Administrator</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Save</Button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {showBanConfirm && selectedUser && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowBanConfirm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="pointer-events-auto w-full max-w-md mx-4"
              >
                <div className="glass-card rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Ban User</h3>
                      <p className="text-sm text-muted-foreground">You are about to ban <strong>{selectedUser.username}</strong></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">Duration</label>
                      <div className="grid grid-cols-2 gap-2">
                        {durationOptions.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setBanDuration(d.value)}
                            className={`p-2.5 rounded-xl border text-sm transition-all ${
                              banDuration === d.value
                                ? "border-red-500/50 bg-red-500/10 text-red-400"
                                : "border-border/50 hover:border-border hover:bg-muted/30"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                        Reason <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Why is this user being banned?"
                        rows={3}
                        className="input-premium w-full resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowBanConfirm(false)}
                        className="flex-1 h-11 rounded-xl border border-border/50 hover:bg-muted/30 transition-all text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBan}
                        disabled={banning}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {banning ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Banning...
                          </span>
                        ) : (
                          "Ban User"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
