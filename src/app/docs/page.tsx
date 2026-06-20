'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, Input, Badge } from "@/components/ui"

const articles = [
  { title: "Getting Started with GHOST License System", category: "Getting Started", views: 1234, slug: "getting-started" },
  { title: "How to Activate Your License Key", category: "Licenses", views: 987, slug: "activate-license" },
  { title: "Understanding License Expiration & Renewal", category: "Licenses", views: 876, slug: "expiration-renewal" },
  { title: "Setting Up Auto-Renewal", category: "Billing", views: 654, slug: "auto-renewal" },
  { title: "How to Upgrade Your Plan", category: "Billing", views: 543, slug: "upgrade-plan" },
  { title: "API Integration Guide", category: "Developer", views: 432, slug: "api-integration" },
  { title: "Managing Multiple Licenses", category: "Licenses", views: 321, slug: "multiple-licenses" },
  { title: "Security Best Practices", category: "Security", views: 298, slug: "security-best-practices" },
  { title: "Troubleshooting Activation Issues", category: "Troubleshooting", views: 876, slug: "troubleshooting-activation" },
  { title: "Understanding Grace Periods", category: "Licenses", views: 234, slug: "grace-periods" },
]

const categories = ["All", "Getting Started", "Licenses", "Billing", "Developer", "Security", "Troubleshooting"]

export default function DocsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "All" || a.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-lg text-muted-foreground mb-8">Everything you need to know about GHOST License System</p>
          <div className="max-w-xl mx-auto">
            <Input placeholder="Search documentation..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="premium-card cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant="primary" className="mb-2">{article.category}</Badge>
                  <h3 className="font-medium group-hover:text-primary transition-colors">{article.title}</h3>
                  <div className="text-xs text-muted-foreground mt-2">{article.views} views</div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
