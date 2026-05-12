"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, User, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Customer {
  id: string
  phone: string
  full_name: string | null
  created_at: string
  is_active: boolean
  job_count?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, jobs(count)")
      .eq("role", "customer")
      .order("created_at", { ascending: false })

    const customersWithJobs = (profiles || []).map(p => ({
      ...p,
      job_count: p.jobs?.[0]?.count || 0
    }))
    setCustomers(customersWithJobs)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const toggleActive = async (customer: Customer) => {
    await supabase
      .from("profiles")
      .update({ is_active: !customer.is_active })
      .eq("id", customer.id)
    fetchCustomers()
  }

  const filteredCustomers = customers.filter(c => {
    const name = c.full_name || ""
    const phone = c.phone || ""
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">View and manage customer accounts</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="ml-auto">{customers.length} total</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Customer</th>
                <th className="text-left p-4 text-sm font-medium">Phone</th>
                <th className="text-left p-4 text-sm font-medium">Jobs</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-sm font-medium">Joined</th>
                <th className="text-left p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No customers found</td></tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{customer.full_name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{customer.phone}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{customer.job_count} jobs</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={customer.is_active ? "success" : "secondary"}>
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant={customer.is_active ? "outline" : "default"}
                      onClick={() => toggleActive(customer)}
                    >
                      {customer.is_active ? (
                        <><X className="h-3 w-3 mr-1" /> Deactivate</>
                      ) : (
                        <><Check className="h-3 w-3 mr-1" /> Activate</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
