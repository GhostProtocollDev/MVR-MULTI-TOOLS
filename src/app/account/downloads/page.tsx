'use client'

import { motion } from "framer-motion"
import { Card, CardContent, Button } from "@/components/ui"
import toast from "react-hot-toast"

const downloads = [
  { name: "GHOST Client v2.0.0", platform: "Windows", size: "64 MB", downloads: 234, date: "Jun 15, 2026" },
  { name: "GHOST Client v2.0.0", platform: "macOS", size: "58 MB", downloads: 189, date: "Jun 15, 2026" },
  { name: "GHOST Client v2.0.0", platform: "Linux", size: "62 MB", downloads: 156, date: "Jun 15, 2026" },
  { name: "GHOST CLI Tool v1.5.0", platform: "All", size: "12 MB", downloads: 567, date: "Jun 10, 2026" },
  { name: "Integration SDK", platform: "Node.js", size: "4 MB", downloads: 89, date: "Jun 5, 2026" },
]

export default function AccountDownloadsPage() {
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Download Center</h1>
        <p className="text-sm text-muted-foreground">Access software downloads and resources</p>
      </div>

      <div className="space-y-3">
        {downloads.map((d) => (
          <Card key={d.name}>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                  {d.platform === "Windows" ? "🪟" : d.platform === "macOS" ? "🍎" : d.platform === "Linux" ? "🐧" : "📦"}
                </div>
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.platform} - {d.size} - {d.downloads} downloads
                  </div>
                  <div className="text-xs text-muted-foreground">Released {d.date}</div>
                </div>
              </div>
              <Button size="sm" onClick={() => toast.success(`Downloading ${d.name}...`)}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
