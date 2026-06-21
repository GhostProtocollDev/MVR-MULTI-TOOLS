"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import toast from "react-hot-toast"

interface Email {
  login: string
  domain: string
  full: string
}

interface InboxMessage {
  id: number
  from: string
  subject: string
  date: string
  body?: string
}

const DOMAINS = ["1secmail.com", "1secmail.org", "1secmail.net", "bheps.com", "dcwpgxblTo.com", "kzccvq.com", "qiott.com"]

export default function GmailGeneratorPage() {
  const [email, setEmail] = useState<Email | null>(null)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [copied, setCopied] = useState(false)

  const generateEmail = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/tempmail?action=genRandomMailbox&count=1")
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const parts = data[0].split("@")
        const newEmail = { login: parts[0], domain: parts[1], full: data[0] }
        setEmail(newEmail)
        setMessages([])
        setSelectedMsg(null)
        toast.success(`Email generated: ${data[0]}`)
      }
    } catch {
      toast.error("Failed to generate email")
    } finally {
      setGenerating(false)
    }
  }, [])

  const checkInbox = useCallback(async () => {
    if (!email) return
    try {
      const res = await fetch(`/api/tempmail?action=getMessages&login=${email.login}&domain=${email.domain}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch {}
  }, [email])

  const readMessage = async (id: number) => {
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tempmail?action=readMessage&login=${email.login}&domain=${email.domain}&id=${id}`)
      const data = await res.json()
      setSelectedMsg(data)
    } catch {
      toast.error("Failed to read message")
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate on mount
  useEffect(() => { generateEmail() }, [generateEmail])

  // Auto-refresh inbox
  useEffect(() => {
    if (!email || !autoRefresh) return
    const t = setInterval(checkInbox, 5000)
    return () => clearInterval(t)
  }, [email, autoRefresh, checkInbox])

  function copyEmail() {
    if (!email) return
    navigator.clipboard.writeText(email.full)
    setCopied(true)
    toast.success("Email copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  function changeDomain(domain: string) {
    if (!email) return
    setEmail({ ...email, domain, full: `${email.login}@${domain}` })
    setMessages([])
    setSelectedMsg(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">📧</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gmail Generator</h1>
            <p className="text-xs text-muted-foreground mt-1">Temporary email with inbox · Auto-refresh 5s</p>
          </div>
        </div>
        <Button size="sm" onClick={generateEmail} loading={generating}>Generate New</Button>
      </div>

      {/* Email Address Card */}
      {email && (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Temporary Email</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-foreground truncate">{email.full}</code>
                <button
                  onClick={copyEmail}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Domain selector */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Domain:</span>
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => changeDomain(d)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
                  email.domain === d ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >@{d}</button>
            ))}
          </div>
        </div>
      )}

      {/* Inbox + Message View */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Inbox List */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Inbox</h2>
              <span className="text-[10px] text-muted-foreground font-mono">{messages.length}</span>
            </div>
            <button onClick={() => setAutoRefresh(!autoRefresh)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              {autoRefresh ? "⏸ Pause" : "▶ Auto"}
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📭</span>
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Waiting for emails... Auto-refresh every 5s</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => readMessage(msg.id)}
                    className={`w-full text-left p-4 hover:bg-muted/20 transition-colors ${
                      selectedMsg?.id === msg.id ? "bg-primary/5 border-l-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{msg.from}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{new Date(msg.date).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.subject || "(no subject)"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Viewer */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Message</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : selectedMsg ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">From</p>
                  <p className="text-sm text-foreground font-medium">{selectedMsg.from}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Subject</p>
                  <p className="text-sm text-foreground">{selectedMsg.subject || "(no subject)"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Date</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedMsg.date).toLocaleString()}</p>
                </div>
                <div className="pt-3 border-t border-border/20">
                  <p className="text-[10px] text-muted-foreground uppercase mb-2">Body</p>
                  <div
                    className="text-sm text-foreground/80 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: selectedMsg.body || "(empty)" }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📬</span>
                <p className="text-sm text-muted-foreground">Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
        <p className="text-xs text-muted-foreground">
          💡 This is a temporary email service. Use it to receive verification codes, test signups, or avoid spam.
          The inbox auto-refreshes every 5 seconds. Click "Generate New" to get a fresh address.
        </p>
      </div>
    </motion.div>
  )
}
