"use client"

import { useEffect, useState } from "react"
import { Search, X, Eye, User, MapPin, RefreshCw } from "lucide-react"
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
  specialties: string[] | null
  is_active: boolean
}

interface JobRow {
  id: string
  customer_id: string
  engineer_id: string | null
  service_id: string | null
  service_category: string
  status: string
  address: string
  created_at: string
  customer?: { full_name: string | null; phone: string | null }
  engineer?: { full_name: string | null }
  service?: { name: string; base_price: number | null }
}

const statusColors: Record<string, string> = {
  pending: "warning",
  assigned: "info",
  in_progress: "default",
  completed: "success",
  cancelled: "destructive",
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [engineers, setEngineers] = useState<EngineerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [dispatchJob, setDispatchJob] = useState<JobRow | null>(null)
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null)
  const [reassignJob, setReassignJob] = useState<JobRow | null>(null)
  const [reassignEngineer, setReassignEngineer] = useState<string | null>(null)
  const [reassignReason, setReassignReason] = useState("")
  const [reassigning, setReassigning] = useState(false)
  const ITEMS_PER_PAGE = 20
  const [page, setPage] = useState(1)

  const supabase = createClient()

  const fetchData = async () => {
    const [jobsRes, engRes] = await Promise.all([
      supabase.from("jobs").select("*, customer:profiles!jobs_customer_id_fkey(full_name, phone), engineer:profiles!jobs_engineer_profile_id_fkey(full_name), service:services(name, base_price)").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, full_name, phone, specialties, is_active").eq("role", "engineer").eq("is_active", true),
    ])
    setJobs(jobsRes.data || [])
    setEngineers(engRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel("jobs-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filteredJobs = jobs.filter(job => {
    const serviceName = job.service?.name || job.service_category
    const matchesSearch = serviceName.toLowerCase().includes(search.toLowerCase()) ||
      job.address.toLowerCase().includes(search.toLowerCase()) ||
      job.customer?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesTab = activeTab === "all" ||
      (activeTab === "pending" && job.status === "pending") ||
      (activeTab === "active" && (job.status === "assigned" || job.status === "in_progress")) ||
      (activeTab === "completed" && job.status === "completed")
    return matchesSearch && matchesStatus && matchesTab
  })

  const pendingJobs = filteredJobs.filter(j => j.status === "pending")
  const activeJobs = filteredJobs.filter(j => j.status === "assigned" || j.status === "in_progress")
  const completedJobs = filteredJobs.filter(j => j.status === "completed")

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)
  const paginatedJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => { setPage(1) }, [search, statusFilter, activeTab, jobs.length])

  const handleDispatch = async () => {
    if (!dispatchJob || !selectedEngineer) return
    setAssigning(true)
    try {
      const response = await fetch(`/api/admin/jobs/${dispatchJob.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineerId: selectedEngineer })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to assign job")
      }
      toast.success("Job assigned successfully")
      setDispatchJob(null)
      setSelectedEngineer(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign job")
    } finally {
      setAssigning(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignJob || !reassignEngineer) return
    setReassigning(true)
    try {
      const response = await fetch(`/api/admin/jobs/${reassignJob.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEngineerId: reassignEngineer, reason: reassignReason })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reassign job")
      }
      toast.success("Job reassigned successfully")
      setReassignJob(null)
      setReassignEngineer(null)
      setReassignReason("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reassign job")
    } finally {
      setReassigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground mt-1">Manage and dispatch jobs</p>
      </div>

      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Jobs", count: filteredJobs.length },
          { key: "pending", label: "Pending", count: pendingJobs.length },
          { key: "active", label: "Active", count: activeJobs.length },
          { key: "completed", label: "Completed", count: completedJobs.length },
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

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-6 py-3 text-sm font-semibold">Service</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Customer</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Engineer</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Location</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Created</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No jobs found</td>
              </tr>
            ) : (
              paginatedJobs.map(job => (
                <tr key={job.id} className="border-b hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="font-medium">{job.service?.name || job.service_category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{job.customer?.full_name || job.customer?.phone || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{job.engineer?.full_name || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[job.status] as any}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground truncate max-w-[150px] block">{job.address}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedJob(job)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {job.status === "pending" ? (
                        <Button size="sm" variant="outline" onClick={() => setDispatchJob(job)}>
                          Assign
                        </Button>
                      ) : null}
                      {(job.status === "assigned" || job.status === "in_progress") && (
                        <Button size="sm" variant="outline" onClick={() => { setReassignJob(job); setReassignEngineer(null) }}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selectedJob && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setSelectedJob(null) }}>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedJob.service?.name || selectedJob.service_category}</SheetTitle>
              <SheetDescription>Job details and management</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <Badge variant={statusColors[selectedJob.status] as any} className="text-sm px-3 py-1">
                  {selectedJob.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(selectedJob.created_at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedJob.customer?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{selectedJob.customer?.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Engineer</p>
                    <p className="font-medium">{selectedJob.engineer?.full_name || "Not assigned"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedJob.address}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Service Details</p>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Service</span>
                      <span className="text-sm font-medium">{selectedJob.service?.name || selectedJob.service_category}</span>
                    </div>
                    {selectedJob.service?.base_price && (
                      <div className="flex justify-between">
                        <span className="text-sm">Base Price</span>
                        <span className="text-sm font-medium">${selectedJob.service.base_price}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedJob.status === "assigned" || selectedJob.status === "in_progress") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setReassignJob(selectedJob); setSelectedJob(null); setReassignEngineer(null) }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reassign Engineer
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {reassignJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Reassign Job</h2>
              <button onClick={() => setReassignJob(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Service</p>
                  <p className="font-semibold text-sm">{reassignJob.service?.name || reassignJob.service_category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Current Engineer</p>
                  <p className="font-semibold text-sm">{reassignJob.engineer?.full_name || "None"}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Reason for Reassignment</label>
                <textarea
                  value={reassignReason}
                  onChange={e => setReassignReason(e.target.value)}
                  className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Engineer unavailable, customer requested change..."
                />
              </div>

              <div>
                <p className="font-semibold mb-3 text-sm">New Engineer</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {engineers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No active engineers available</p>
                  ) : (
                    engineers.map(eng => (
                      <label
                        key={eng.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          reassignEngineer === eng.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reassign-engineer"
                          value={eng.id}
                          checked={reassignEngineer === eng.id}
                          onChange={(e) => setReassignEngineer(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{eng.full_name || "Engineer"}</p>
                          <p className="text-xs text-muted-foreground">
                            {eng.specialties?.join(", ") || "No specialties"}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30 sticky bottom-0">
              <Button variant="outline" className="flex-1" onClick={() => { setReassignJob(null); setReassignEngineer(null); setReassignReason("") }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!reassignEngineer || reassigning} onClick={handleReassign}>
                {reassigning ? "Reassigning..." : "Confirm Reassign"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {dispatchJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Dispatch Job</h2>
              <button onClick={() => setDispatchJob(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Service</p>
                  <p className="font-semibold text-sm">{dispatchJob.service?.name || dispatchJob.service_category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Customer</p>
                  <p className="font-semibold text-sm">{dispatchJob.customer?.full_name || dispatchJob.customer?.phone || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Location</p>
                  <p className="font-semibold text-sm">{dispatchJob.address}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-3 text-sm">Available Engineers</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {engineers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No active engineers available</p>
                  ) : (
                    engineers.map(eng => (
                      <label
                        key={eng.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEngineer === eng.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="engineer"
                          value={eng.id}
                          checked={selectedEngineer === eng.id}
                          onChange={(e) => setSelectedEngineer(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{eng.full_name || "Engineer"}</p>
                          <p className="text-xs text-muted-foreground">
                            {eng.specialties?.join(", ") || "No specialties"}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30 sticky bottom-0">
              <Button variant="outline" className="flex-1" onClick={() => setDispatchJob(null)}>Cancel</Button>
              <Button className="flex-1" disabled={!selectedEngineer || assigning} onClick={handleDispatch}>
                {assigning ? "Assigning..." : "Assign Engineer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
