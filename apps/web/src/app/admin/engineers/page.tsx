"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, User, Shield, Clock, X, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface EngineerProfile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  role: string
  is_active: boolean
  specialties: string[] | null
  must_change_password: boolean
  created_at: string
}

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<EngineerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    specialties: "",
  })

  const supabase = createClient()

  const fetchEngineers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "engineer")
      .order("created_at", { ascending: false })
    setEngineers(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEngineers() }, [fetchEngineers])

  const filteredEngineers = engineers.filter(eng => {
    const name = eng.full_name || ""
    const phone = eng.phone || ""
    const email = eng.email || ""
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search) || email.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === "all" ||
      (activeTab === "active" && eng.is_active) ||
      (activeTab === "inactive" && !eng.is_active)
    return matchesSearch && matchesTab
  })

  const toggleActive = async (eng: EngineerProfile) => {
    await supabase.from("profiles").update({ is_active: !eng.is_active }).eq("id", eng.id)
    fetchEngineers()
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/engineers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          full_name: createForm.full_name,
          phone: createForm.phone,
          specialties: createForm.specialties ? createForm.specialties.split(",").map(s => s.trim()) : [],
        })
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to create engineer")
      } else {
        setShowCreate(false)
        setCreateForm({ email: "", password: "", full_name: "", phone: "", specialties: "" })
        fetchEngineers()
      }
    } catch {
      alert("Failed to create engineer")
    }
    setCreating(false)
  }

  const activeCount = engineers.filter(e => e.is_active).length
  const inactiveCount = engineers.filter(e => !e.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineers</h1>
          <p className="text-muted-foreground mt-1">Manage engineer accounts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Engineer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{engineers.length}</p>
              <p className="text-xs text-muted-foreground">Total Engineers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All", count: filteredEngineers.length },
          { key: "active", label: "Active", count: activeCount },
          { key: "inactive", label: "Inactive", count: inactiveCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search engineers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Engineer</th>
                <th className="text-left p-4 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-sm font-medium">Specialties</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Created</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredEngineers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No engineers found</td></tr>
              ) : filteredEngineers.map(eng => (
                <tr key={eng.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{eng.full_name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{eng.email || "—"}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {eng.specialties && eng.specialties.length > 0 ? (
                        eng.specialties.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={eng.is_active ? "success" : "secondary"}>
                      {eng.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{new Date(eng.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant={eng.is_active ? "outline" : "default"}
                      onClick={() => toggleActive(eng)}
                    >
                      {eng.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Create Engineer</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="Mohamed Ali" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="engineer@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Temporary Password</label>
                <Input value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Temp123!" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+252 61 234 5678" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Specialties (comma-separated)</label>
                <Input value={createForm.specialties} onChange={e => setCreateForm({ ...createForm, specialties: e.target.value })} placeholder="AC, Wiring, Solar" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!createForm.email || !createForm.password || creating} onClick={handleCreate}>
                {creating ? "Creating..." : "Create Engineer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
