'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, Button, Input, Badge, Modal } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

export default function PlansManagePage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: "", description: "", price: 0, originalPrice: 0,
    interval: "monthly", durationDays: 30, features: "", isPopular: false,
  })

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Plan created")
      setShowCreate(false)
      const data = await fetch("/api/plans").then((r) => r.json())
      setPlans(data.plans || [])
    } catch {
      toast.error("Failed to create plan")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage subscription plans</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Plan</Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              {plan.isPopular && (
                <div className="absolute top-3 right-3"><Badge variant="success">Popular</Badge></div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={plan.isActive ? "success" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span>{plan.durationDays} days</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Plan">
        <div className="space-y-4">
          <Input label="Name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
          <Input label="Description" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })} />
            <Input label="Original Price" type="number" value={newPlan.originalPrice} onChange={(e) => setNewPlan({ ...newPlan, originalPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interval" value={newPlan.interval} onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value })} />
            <Input label="Duration (days)" type="number" value={newPlan.durationDays} onChange={(e) => setNewPlan({ ...newPlan, durationDays: parseInt(e.target.value) || 30 })} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Popular</label>
            <input type="checkbox" checked={newPlan.isPopular} onChange={(e) => setNewPlan({ ...newPlan, isPopular: e.target.checked })} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
