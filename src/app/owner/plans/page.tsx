'use client'

import { Badge, Button } from "@/components/ui"

export default function OwnerPlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Create, edit, and manage subscription plans</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 h-auto">
          <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
          Create Plan
        </Button>
      </div>
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800">
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Name</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Price</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Duration</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Subscribers</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Status</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500">Actions</th>
          </tr></thead>
          <tbody>
            {[
              { name: "Starter", price: "$29/mo", duration: "30 days", subscribers: 89, status: "active" },
              { name: "Professional", price: "$79/mo", duration: "30 days", subscribers: 234, status: "active" },
              { name: "Enterprise", price: "$199/mo", duration: "30 days", subscribers: 56, status: "active" },
            ].map((p) => (
              <tr key={p.name} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                <td className="p-4 text-sm text-zinc-300 font-medium">{p.name}</td>
                <td className="p-4 text-sm text-zinc-300">{p.price}</td>
                <td className="p-4 text-sm text-zinc-400">{p.duration}</td>
                <td className="p-4 text-sm text-zinc-400">{p.subscribers}</td>
                <td className="p-4"><Badge variant="success">Active</Badge></td>
                <td className="p-4"><div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Edit</button>
                  <button className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Disable</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
