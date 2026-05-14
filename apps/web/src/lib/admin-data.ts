import { createClient } from "@/lib/supabase/server"

export type JobStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled"

export interface Engineer {
  id: string
  user_id: string
  full_name?: string | null
  phone?: string | null
  specialties: string[] | null
  created_at: string
  profile?: {
    full_name: string | null
    phone: string | null
  }
}

export interface Service {
  id: string
  name: string
  description: string | null
  category: string | null
  base_price: number | null
  icon_url: string | null
  is_active: boolean
  created_at: string
}

export interface Job {
  id: string
  customer_id: string
  engineer_id: string | null
  service_id: string | null
  service_category: string
  status: JobStatus
  address: string
  lat: number
  lng: number
  created_at: string
  updated_at: string
  customer?: {
    full_name: string | null
    phone: string | null
  }
  engineer?: {
    id: string
    full_name: string | null
    phone: string | null
  }
  service?: {
    name: string
    base_price: number | null
  }
}

export interface DashboardStats {
  activeEngineers: number
  jobsInProgress: number
  pendingJobs: number
  completedToday: number
  totalCustomers: number
}

export interface CustomServiceRequest {
  id: string
  customer_id: string
  description: string
  estimated_budget: string | null
  photos: string[] | null
  status: string
  admin_response: string | null
  reviewed_by_admin_id: string | null
  reviewed_at: string | null
  job_id: string | null
  created_at: string
  customer?: {
    full_name: string | null
    phone: string | null
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: activeEngineers },
    { count: jobsInProgress },
    { count: pendingJobs },
    { count: completedToday },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "engineer"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", today.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
  ])

  return {
    activeEngineers: activeEngineers || 0,
    jobsInProgress: jobsInProgress || 0,
    pendingJobs: pendingJobs || 0,
    completedToday: completedToday || 0,
    totalCustomers: totalCustomers || 0,
  }
}

export async function getRecentJobs(limit: number = 10): Promise<Job[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("jobs")
    .select("*, customer:profiles!jobs_customer_id_fkey!inner(full_name, phone), service:services(name)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) console.error(error)
  return data || []
}


