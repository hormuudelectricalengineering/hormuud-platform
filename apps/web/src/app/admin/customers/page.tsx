"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, User, Check, X, Eye, Briefcase, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "sonner"

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerJobs, setCustomerJobs] = useState<any[]>([])
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false)
  const ITEMS_PER_PAGE = 15
  const [page, setPage] = useState(1)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, jobs!jobs_customer_id_fkey(count)")
      .eq("role", "customer")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[customers] fetch error:", error)
    }

    const customersWithJobs = (profiles || []).map(p => ({
      ...p,
      job_count: p.jobs?.[0]?.count ?? 0
    }))
    setCustomers(customersWithJobs)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  useEffect(() => { setPage(1) }, [search])

  const toggleActive = async (customer: Customer) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !customer.is_active })
      .eq("id", customer.id)
    if (error) {
      console.error("[customers] toggleActive error:", error)
      toast.error("Failed to update customer status")
    } else {
      toast.success(customer.is_active ? "Customer deactivated" : "Customer activated")
      fetchCustomers()
    }
  }

  const viewCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setLoadingCustomerDetail(true)
    const { data } = await supabase
      .from("jobs")
      .select("*, service:services(name)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
    setCustomerJobs(data || [])
    setLoadingCustomerDetail(false)
  }

  const openEdit = (customer: Customer) => {
    setEditForm({ full_name: customer.full_name || "", phone: customer.phone })
    setEditCustomer(customer)
  }

  const handleEditSave = async () => {
    if (!editCustomer) return
    setSavingEdit(true)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name || null, phone: editForm.phone })
      .eq("id", editCustomer.id)
    if (error) {
      console.error("[customers] edit error:", error)
      toast.error("Failed to update customer")
    } else {
      toast.success("Customer updated")
      setEditCustomer(null)
      fetchCustomers()
    }
    setSavingEdit(false)
  }

  const openDelete = (customer: Customer) => {
    setDeleteCustomer(customer)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCustomer) return
    setDeleting(true)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", deleteCustomer.id)
    if (error) {
      console.error("[customers] delete error:", error)
      toast.error("Failed to delete customer")
    } else {
      toast.success("Customer deleted")
      setDeleteCustomer(null)
      fetchCustomers()
    }
    setDeleting(false)
  }

  const filteredCustomers = customers.filter(c => {
    const name = c.full_name || ""
    const phone = c.phone || ""
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search)
  })

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = filteredCustomers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-4"><Skeleton className="h-4 w-full max-w-[100px]" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No customers found</td></tr>
              ) : paginatedCustomers.map(customer => (
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
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => viewCustomerDetail(customer)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(customer)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDelete(customer)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
      {editCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Edit Customer</h2>
              <button onClick={() => setEditCustomer(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Customer name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+252 61 234 5678" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setEditCustomer(null)}>Cancel</Button>
              <Button className="flex-1" disabled={savingEdit} onClick={handleEditSave}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-destructive">Delete Customer</h2>
              <button onClick={() => setDeleteCustomer(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleteCustomer.full_name || "this customer"}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteCustomer(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleting} onClick={handleDeleteConfirm}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <Sheet open={true} onOpenChange={(open) => { if (!open) setSelectedCustomer(null) }}>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedCustomer.full_name || "Customer"}</SheetTitle>
              <SheetDescription>Customer details and job history</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <Badge variant={selectedCustomer.is_active ? "success" : "secondary"}>
                  {selectedCustomer.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedCustomer.phone || "—"}</p>
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job History ({customerJobs.length})
                </p>
                {loadingCustomerDetail ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : customerJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No jobs yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {customerJobs.map(job => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{job.service?.name || job.service_category}</span>
                          <Badge variant={job.status === "completed" ? "success" : job.status === "cancelled" ? "destructive" : job.status === "pending" ? "warning" : "info"} className="text-xs">
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
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
