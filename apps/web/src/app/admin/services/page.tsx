"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Edit, Trash2, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Service } from "@/lib/admin-data"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    base_price: "",
    icon_url: "",
  })

  const supabase = createClient()

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true })
    setServices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({ name: "", description: "", category: "", base_price: "", icon_url: "" })
    setEditingService(null)
    setShowForm(false)
  }

  const openEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description || "",
      category: service.category || "",
      base_price: service.base_price?.toString() || "",
      icon_url: service.icon_url || "",
    })
    setEditingService(service)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      base_price: form.base_price ? parseFloat(form.base_price) : null,
      icon_url: form.icon_url || null,
    }

    if (editingService) {
      await supabase.from("services").update(payload).eq("id", editingService.id)
    } else {
      await supabase.from("services").insert(payload)
    }

    setSaving(false)
    resetForm()
    fetchServices()
  }

  const handleToggleActive = async (service: Service) => {
    await supabase.from("services").update({ is_active: !service.is_active }).eq("id", service.id)
    fetchServices()
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Delete "${service.name}"?`)) return
    await supabase.from("services").delete().eq("id", service.id)
    fetchServices()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">Manage the service catalog</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="ml-auto">{services.length} total</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Service</th>
                <th className="text-left p-4 text-sm font-medium">Category</th>
                <th className="text-left p-4 text-sm font-medium">Price</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-right p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No services found</td></tr>
              ) : filteredServices.map(service => (
                <tr key={service.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{service.name}</span>
                        {service.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{service.category || "—"}</Badge>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">${service.base_price?.toFixed(2) || "—"}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={service.is_active ? "success" : "secondary"}>
                      {service.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleToggleActive(service)}>
                        {service.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(service)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(service)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingService ? "Edit Service" : "Add Service"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="AC Installation" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  className="w-full p-3 border rounded-md text-sm"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Professional installation of AC units"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="AC">AC</option>
                    <option value="Wiring">Wiring</option>
                    <option value="Solar">Solar</option>
                    <option value="Generator">Generator</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Base Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={e => setForm({ ...form, base_price: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Icon</label>
                <Input value={form.icon_url} onChange={e => setForm({ ...form, icon_url: e.target.value })} placeholder="snowflake" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button className="flex-1" disabled={!form.name || saving} onClick={handleSave}>
                {saving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
