'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, Button, Input } from "@/components/ui"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { COUNTRIES } from "@/lib/countries"
import { getFlagEmoji } from "@/lib/geo"

export default function CreateBuilderPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [allowedDomains, setAllowedDomains] = useState("")
  const [country, setCountry] = useState("")
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<any>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Builder name is required")
    setCreating(true)
    try {
      const res = await fetch("/api/remote/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, allowedDomains: allowedDomains || undefined, country: country || undefined }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setCreated(data.builder)
      toast.success("Builder created!")
    } catch {
      toast.error("Failed to create builder")
    } finally {
      setCreating(false)
    }
  }

  if (created) {
    const cert = created.certificate ? JSON.parse(created.certificate) : null

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Builder Created</h1>
            <p className="text-muted-foreground mt-1">Save these credentials — they cannot be recovered later</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400 font-medium">⚠️ Critical: Save this information now. The client secret will not be shown again.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Builder UUID</label>
              <code className="block w-full p-3 bg-black/40 rounded-xl text-sm font-mono select-all">{created.uuid}</code>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Fingerprint</label>
              <code className="block w-full p-3 bg-black/40 rounded-xl text-sm font-mono select-all">{created.fingerprint}</code>
            </div>
            {cert && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Certificate (Self-Signed)</label>
                <pre className="w-full p-3 bg-black/40 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(cert, null, 2)}
                </pre>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Windows Client Config (paste into installer)
              </label>
              <pre className="w-full p-3 bg-black/40 rounded-xl text-xs font-mono select-all whitespace-pre-wrap">
{`REMOTE_SERVER=http://localhost:3000
BUILDER_UUID=${created.uuid}
BUILDER_FINGERPRINT=${created.fingerprint}
CLIENT_HEARTBEAT_INTERVAL=30
CLIENT_POLL_COMMANDS=true`}
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(created.uuid); toast.success("UUID copied!") }}>
              Copy UUID
            </Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ uuid: created.uuid, fingerprint: created.fingerprint }, null, 2)); toast.success("Config copied!") }}>
              Copy Config
            </Button>
            <Button onClick={() => router.push("/dashboard/remote/builders")}>
              Back to Builders
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/remote/builders")} className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Builder</h1>
          <p className="text-muted-foreground mt-1">Generate a new builder instance with cryptographic identity</p>
        </div>
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleCreate} className="space-y-5">
          <Input label="Builder Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Corporate Deployment" required />
          <div className="space-y-2">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this builder instance..."
              rows={3}
              className="input-premium w-full resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Allowed Domains <span className="text-muted-foreground font-normal">(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={allowedDomains}
              onChange={(e) => setAllowedDomains(e.target.value)}
              placeholder="example.com, corp.local"
              className="input-premium w-full"
            />
            <p className="text-xs text-muted-foreground">Restrict client connections to these domains. Leave empty for any.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country <span className="text-muted-foreground font-normal">(optional)</span></label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-premium w-full appearance-none"
              >
                <option value="">🌍 Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            {country && (
              <p className="text-xs text-primary/70">
                {getFlagEmoji(country)} This builder will be tagged with the selected country
              </p>
            )}
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground">
              This will generate a cryptographically unique identity with a self-signed certificate,
              SHA-256 fingerprint, and a UUID v4 identifier. Each builder operates as an isolated
              entity — clients are permanently bound to their builder.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/remote/builders")}>Cancel</Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? "Creating..." : "Create Builder"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
