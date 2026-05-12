"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, MapPin, User, Wrench, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface QueueJob {
  id: string
  customer_id: string
  service_category: string
  address: string
  created_at: string
  customer?: { full_name: string | null; phone: string | null }
  service?: { name: string }
}

export default function JobQueuePage() {
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  const supabase = createClient()

  const fetchQueue = useCallback(async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*, customer:profiles!jobs_customer_id_fkey(full_name, phone), service:services(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
    setJobs(data || [])
    setLoading(false)
    setNow(Date.now())
  }, [supabase])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 15000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  const getWaitMinutes = (createdAt: string) => {
    const diff = now - new Date(createdAt).getTime()
    return Math.floor(diff / 60000)
  }

  const urgentJobs = jobs.filter(j => getWaitMinutes(j.created_at) > 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Queue</h1>
        <p className="text-muted-foreground mt-1">Pending jobs waiting for assignment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-xs text-muted-foreground">Pending Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentJobs.length}</p>
              <p className="text-xs text-muted-foreground">Urgent (&gt;10 min)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {urgentJobs.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">{urgentJobs.length} jobs waiting more than 10 minutes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No pending jobs in queue</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Service</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Location</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Wait Time</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const waitTime = getWaitMinutes(job.created_at)
                    return (
                      <tr key={job.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{job.customer?.full_name || job.customer?.phone || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{job.service?.name || job.service_category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{job.address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={waitTime > 10 ? "destructive" : "secondary"}>
                            {waitTime} min
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" onClick={() => { window.location.href = `/admin/jobs` }}>
                            View & Assign
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
