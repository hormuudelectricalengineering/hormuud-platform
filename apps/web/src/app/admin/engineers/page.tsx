"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, User, Shield, Clock, X, Check, Plus, Eye, Briefcase, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"

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
  const ITEMS_PER_PAGE = 15
  const [page, setPage] = useState(1)
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerProfile | null>(null)
  const [engineerJobs, setEngineerJobs] = useState<any[]>([])
  const [engineerAssignments, setEngineerAssignments] = useState<any[]>([])
  const [loadingEngDetail, setLoadingEngDetail] = useState(false)

  const [editEngineer, setEditEngineer] = useState<EngineerProfile | null>(null)
  const [deleteEngineer, setDeleteEngineer] = useState<EngineerProfile | null>(null)
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", specialties: "" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    specialties: "",
  })

  const supabase = createClient()

  const statusColors: Record<string, "warning" | "info" | "default" | "success" | "destructive"> = {
    pending: "warning",
    assigned: "info",
    in_progress: "default",
    completed: "success",
    cancelled: "destructive",
  }

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

  const totalPages = Math.ceil(filteredEngineers.length / ITEMS_PER_PAGE)
  const paginatedEngineers = filteredEngineers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => { setPage(1) }, [search, activeTab])

  const toggleActive = async (eng: EngineerProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !eng.is_active })
      .eq("id", eng.id)
    if (error) {
      console.error("[engineers] toggleActive error:", error)
      toast.error("Failed to update engineer status")
    } else {
      toast.success(eng.is_active ? "Engineer deactivated" : "Engineer activated")
      fetchEngineers()
    }
  }

  const viewEngineerDetail = async (eng: EngineerProfile) => {
    setSelectedEngineer(eng)
    setLoadingEngDetail(true)
    const [jobsRes, assignmentsRes] = await Promise.all([
      supabase.from("jobs").select("*, service:services(name)").eq("engineer_id", eng.id).order("created_at", { ascending: false }),
      supabase.from("engineer_assignments").select("*").eq("engineer_id", eng.id).order("created_at", { ascending: false }),
    ])
    setEngineerJobs(jobsRes.data || [])
    setEngineerAssignments(assignmentsRes.data || [])
    setLoadingEngDetail(false)
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
        toast.error(err.error || "Failed to create engineer")
      } else {
        toast.success("Engineer created successfully")
        setShowCreate(false)
        setCreateForm({ email: "", password: "", full_name: "", phone: "", specialties: "" })
        fetchEngineers()
      }
    } catch {
      toast.error("Failed to create engineer")
    }
    setCreating(false)
  }

  const openEdit = (eng: EngineerProfile) => {
    setEditForm({
      full_name: eng.full_name || "",
      phone: eng.phone || "",
      email: eng.email || "",
      specialties: eng.specialties?.join(", ") || "",
    })
    setEditEngineer(eng)
  }

  const handleEditSave = async () => {
    if (!editEngineer) return
    setSavingEdit(true)
    const specialties = editForm.specialties
      ? editForm.specialties.split(",").map(s => s.trim()).filter(Boolean)
      : []
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name || null,
        phone: editForm.phone || null,
        specialties,
      })
      .eq("id", editEngineer.id)
    if (error) {
      console.error("[engineers] edit error:", error)
      toast.error("Failed to update engineer")
    } else {
      toast.success("Engineer updated")
      setEditEngineer(null)
      fetchEngineers()
    }
    setSavingEdit(false)
  }

  const openDelete = (eng: EngineerProfile) => {
    setDeleteEngineer(eng)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteEngineer) return
    setDeleting(true)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", deleteEngineer.id)
    if (error) {
      console.error("[engineers] delete error:", error)
      toast.error("Failed to delete engineer")
    } else {
      toast.success("Engineer deleted")
      setDeleteEngineer(null)
      fetchEngineers()
    }
    setDeleting(false)
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-4"><Skeleton className="h-4 w-full max-w-[100px]" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredEngineers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No engineers found</td></tr>
              ) : paginatedEngineers.map(eng => (
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
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => viewEngineerDetail(eng)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(eng)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDelete(eng)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={eng.is_active ? "outline" : "default"}
                        onClick={() => toggleActive(eng)}
                      >
                        {eng.is_active ? (
                          <><X className="h-3 w-3 mr-1" /> Deactivate</>
                        ) : (
                          <><Check className="h-3 w-3 mr-1" /> Activate</>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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

      {editEngineer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Edit Engineer</h2>
              <button onClick={() => setEditEngineer(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Engineer name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+252 61 234 5678" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="engineer@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Specialties (comma-separated)</label>
                <Input value={editForm.specialties} onChange={e => setEditForm({ ...editForm, specialties: e.target.value })} placeholder="AC, Wiring, Solar" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setEditEngineer(null)}>Cancel</Button>
              <Button className="flex-1" disabled={savingEdit} onClick={handleEditSave}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteEngineer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-destructive">Delete Engineer</h2>
              <button onClick={() => setDeleteEngineer(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleteEngineer.full_name || "this engineer"}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteEngineer(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleting} onClick={handleDeleteConfirm}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedEngineer && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setSelectedEngineer(null) }}>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedEngineer.full_name || "Engineer"}</SheetTitle>
              <SheetDescription>Engineer details and activity</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <Badge variant={selectedEngineer.is_active ? "success" : "secondary"}>
                  {selectedEngineer.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(selectedEngineer.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedEngineer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEngineer.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Specialties</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {selectedEngineer.specialties && selectedEngineer.specialties.length > 0
                      ? selectedEngineer.specialties.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)
                      : <span className="text-sm text-muted-foreground">None</span>
                    }
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Current Jobs ({engineerJobs.filter(j => j.status !== "completed" && j.status !== "cancelled").length})
                </p>
                {loadingEngDetail ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : engineerJobs.filter(j => j.status !== "completed" && j.status !== "cancelled").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active jobs</p>
                ) : (
                  <div className="space-y-2">
                    {engineerJobs.filter(j => j.status !== "completed" && j.status !== "cancelled").map(job => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{job.service?.name || job.service_category}</span>
                          <Badge variant={statusColors[job.status] ?? "default"} className="text-xs">{job.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-3">Assignment History ({engineerAssignments.length})</p>
                {engineerAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {engineerAssignments.map(a => (
                      <div key={a.id} className="p-2 border-b last:border-0 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                          {a.reassignment_reason && ` — ${a.reassignment_reason}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
