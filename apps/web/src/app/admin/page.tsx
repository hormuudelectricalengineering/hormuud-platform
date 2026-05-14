import { Suspense } from "react"
import { Users, Wrench, Clock, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats, getRecentJobs } from "@/lib/admin-data"
import { createClient } from "@/lib/supabase/server"

async function StatsCards() {
  const stats = await getDashboardStats()

  const cardData = [
    { title: "Engineers", value: stats.activeEngineers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Jobs In Progress", value: stats.jobsInProgress, icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Customers", value: stats.totalCustomers, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Completed Today", value: stats.completedToday, icon: Clock, color: "text-violet-500", bg: "bg-violet-500/10" },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, i) => (
        <Card key={i} className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl transition-transform duration-300 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function RecentActivity() {
  const jobs = await getRecentJobs(8)

  const statusColors: Record<string, string> = {
    pending: "warning",
    assigned: "info",
    in_progress: "default",
    completed: "success",
    cancelled: "destructive",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{job.service?.name || job.service_category}</span>
                <span className="text-xs text-muted-foreground">{job.address}</span>
              </div>
              <div className="flex items-center gap-2">
                {job.customer && (
                  <span className="text-xs text-muted-foreground">{job.customer.full_name || job.customer.phone}</span>
                )}
                <Badge variant={statusColors[job.status] as any}>{job.status.replace("_", " ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function JobStatusChart() {
  const supabase = await createClient()
  const [{ count: pending }, { count: assigned }, { count: inProgress }, { count: completed }, { count: cancelled }] =
    await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "assigned"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    ])

  const data = [
    { label: "Pending", value: pending || 0, color: "bg-amber-500" },
    { label: "Assigned", value: assigned || 0, color: "bg-blue-500" },
    { label: "In Progress", value: inProgress || 0, color: "bg-indigo-500" },
    { label: "Completed", value: completed || 0, color: "bg-emerald-500" },
    { label: "Cancelled", value: cancelled || 0, color: "bg-red-500" },
  ]

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Jobs by Status</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function QuickStats() {
  const stats = await getDashboardStats()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
          <Badge variant="warning">{stats.pendingJobs}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-2xl font-bold">{stats.pendingJobs}</span>
            <span className="text-xs text-muted-foreground">waiting for assignment</span>
          </div>
        </CardContent>
      </Card>
      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <Badge variant="success">{stats.completedToday}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-2xl font-bold">{stats.completedToday}</span>
            <span className="text-xs text-muted-foreground">jobs finished</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Hormuud Electrical Services</p>
      </div>

      <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-lg"></div></div>}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<div className="h-80 bg-muted rounded-lg animate-pulse"></div>}>
          <RecentActivity />
        </Suspense>
        <div className="space-y-6">
          <Suspense fallback={<div className="h-48 bg-muted rounded-lg animate-pulse"></div>}>
            <JobStatusChart />
          </Suspense>
          <Suspense fallback={<div className="h-32 bg-muted rounded-lg animate-pulse"></div>}>
            <QuickStats />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
