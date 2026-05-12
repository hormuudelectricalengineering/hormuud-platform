"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

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
      setDispatchJob(null)
      setSelectedEngineer(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to assign job")
    } finally {
      setAssigning(false)
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
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No jobs found</td>
              </tr>
            ) : (
              filteredJobs.map(job => (
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
                    {job.status === "pending" ? (
                      <Button size="sm" variant="outline" onClick={() => setDispatchJob(job)}>
                        Assign
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
