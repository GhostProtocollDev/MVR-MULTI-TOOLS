'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Spinner, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { useSession, signIn } from "next-auth/react"
import toast from "react-hot-toast"

interface Device {
  id: string
  name: string | null
  type: string | null
  os: string | null
  browser: string | null
  ip: string | null
  isTrusted: boolean
  lastUsed: string
  createdAt: string
}

interface LoginSession {
  id: string
  ip: string | null
  userAgent: string | null
  location: string | null
  status: string
  createdAt: string
}

export default function UserSettingsPage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState((session?.user as any)?.email || "")
  const [notifications, setNotifications] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)

  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/user/devices")
        const data = await res.json()
        if (data.devices) setDevices(data.devices)
      } catch {
        toast.error("Error al cargar dispositivos")
      } finally {
        setLoadingDevices(false)
      }
    }
    async function fetchSessions() {
      try {
        const res = await fetch("/api/user/sessions")
        const data = await res.json()
        if (data.sessions) setSessions(data.sessions)
      } catch {
        toast.error("Error al cargar historial de sesiones")
      } finally {
        setLoadingSessions(false)
      }
    }
    fetchDevices()
    fetchSessions()
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Contraseña cambiada exitosamente")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Error al cambiar contraseña")
      }
    } catch {
      toast.error("Error al cambiar contraseña")
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleRemoveDevice(deviceId: string) {
    try {
      const res = await fetch("/api/user/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deviceId))
        toast.success("Dispositivo eliminado")
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al eliminar dispositivo")
      }
    } catch {
      toast.error("Error al eliminar dispositivo")
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const googleEmail = (session?.user as any)?.googleEmail

  async function handleUnlinkGoogle() {
    try {
      const res = await fetch("/api/user/google/unlink", { method: "POST" })
      if (res.ok) {
        toast.success("Cuenta de Google desvinculada")
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al desvincular")
      }
    } catch {
      toast.error("Error al desvincular cuenta de Google")
    }
  }

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground mt-1">Configura tu experiencia en la plataforma</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre</label>
              <p className="text-foreground">{(session?.user as any)?.name || (session?.user as any)?.username || "Usuario"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rol</label>
              <p className="text-foreground">{(session?.user as any)?.role || "user"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Correo Electrónico</label>
              <p className="text-foreground">{email || "No configurado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta de Google</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Vincula tu cuenta de Google para iniciar sesión rápidamente</p>
            {googleEmail ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                    {(session?.user as any)?.name?.[0]?.toUpperCase() || "G"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{googleEmail}</p>
                    <Badge variant="success">Vinculada</Badge>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={handleUnlinkGoogle}>
                  Desvincular Google
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => signIn("google", { callbackUrl: "/dashboard/settings" })}>
                Vincular Google
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm font-medium">Notificaciones</span>
                <p className="text-xs text-muted-foreground">Recibir notificaciones del sistema</p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="rounded border-border"
              />
            </label>
            <Button onClick={() => toast.success("Preferencias guardadas")}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idioma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Idioma de la interfaz</p>
            <div className="flex gap-2">
              <Button variant={true ? "primary" : "ghost"} onClick={() => toast.success("Idioma cambiado")}>Español</Button>
              <Button variant="ghost" onClick={() => toast.success("Language changed")}>English</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Gestiona la seguridad de tu cuenta</p>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <Input
                label="Contraseña Actual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="Nueva Contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar Nueva Contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={changingPassword}>
                Cambiar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Dispositivos conectados a tu cuenta</p>
            {loadingDevices ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay dispositivos registrados</p>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{device.name || "Dispositivo desconocido"}</span>
                        {device.isTrusted && <Badge variant="success">Confiado</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[device.type, device.os, device.browser].filter(Boolean).join(" · ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Último uso: {formatDate(device.lastUsed)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Sesiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Últimas sesiones de inicio de sesión</p>
            {loadingSessions ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay historial de sesiones</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>{s.ip || "—"}</TableCell>
                      <TableCell>{s.location || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "success" ? "success" : "danger"}>
                          {s.status === "success" ? "Éxito" : s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
