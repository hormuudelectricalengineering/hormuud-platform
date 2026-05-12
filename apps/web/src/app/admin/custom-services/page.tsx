"use client"

import { useEffect, useState, useCallback } from "react"
import { FileEdit, Search, Check, X, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { CustomServiceRequest } from "@/lib/admin-data"

const statusColors: Record<string, string> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
}

export default function CustomServicesPage() {
  const [requests, setRequests] = useState<CustomServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedRequest, setSelectedRequest] = useState<CustomServiceRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from("custom_service_requests")
      .select("*")
      .order("created_at", { ascending: false })
    const items: CustomServiceRequest[] = (data || []).map((r: any) => ({ ...r, customer: null }))

    const customerIds = [...new Set(items.map(r => r.customer_id))]
    if (customerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", customerIds)
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      for (const r of items) {
        r.customer = profileMap.get(r.customer_id) || null
      }
    }

    setRequests(items)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const filteredRequests = requests.filter(r => {
    const name = r.customer?.full_name || ""
    const desc = r.description || ""
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === "all" || r.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleAccept = async (req: CustomServiceRequest) => {
    setProcessing(true)
    await supabase
      .from("custom_service_requests")
      .update({ status: "accepted", admin_response: "Your request has been accepted. We will assign an engineer shortly.", reviewed_at: new Date().toISOString() })
      .eq("id", req.id)
    setSelectedRequest(null)
    setProcessing(false)
    fetchRequests()
  }

  const handleReject = async (req: CustomServiceRequest) => {
    if (!rejectReason.trim()) return
    setProcessing(true)
    await supabase
      .from("custom_service_requests")
      .update({ status: "rejected", admin_response: rejectReason, reviewed_at: new Date().toISOString() })
      .eq("id", req.id)
    setSelectedRequest(null)
    setRejectReason("")
    setProcessing(false)
    fetchRequests()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Services</h1>
        <p className="text-muted-foreground mt-1">Review and manage custom service requests</p>
      </div>

      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: "pending", label: "Pending", count: requests.filter(r => r.status === "pending").length },
          { key: "accepted", label: "Accepted", count: requests.filter(r => r.status === "accepted").length },
          { key: "rejected", label: "Rejected", count: requests.filter(r => r.status === "rejected").length },
          { key: "all", label: "All", count: requests.length },
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
        <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No custom service requests found</div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map(req => (
            <Card key={req.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedRequest(req)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{req.customer?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{req.customer?.phone}</p>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2">{req.description}</p>
                    {req.estimated_budget && (
                      <p className="text-xs text-muted-foreground mt-1">Budget: {req.estimated_budget}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[req.status] as any}>
                      {req.status}
                    </Badge>
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Request Details</h2>
              <button
                onClick={() => { setSelectedRequest(null); setRejectReason("") }}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedRequest.customer?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.customer?.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Description</p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>

              {selectedRequest.estimated_budget && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Estimated Budget</p>
                  <p className="font-semibold">{selectedRequest.estimated_budget}</p>
                </div>
              )}

              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Photos ({selectedRequest.photos.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRequest.photos.map((url, i) => (
                      <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Badge variant={statusColors[selectedRequest.status] as any}>{selectedRequest.status}</Badge>
                <span className="text-xs text-muted-foreground ml-2">
                  Submitted {new Date(selectedRequest.created_at).toLocaleDateString()}
                </span>
              </div>

              {selectedRequest.admin_response && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Admin Response</p>
                  <p className="text-sm">{selectedRequest.admin_response}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Rejection Reason (if rejecting)</label>
                    <textarea
                      className="w-full p-3 border rounded-md text-sm"
                      rows={3}
                      placeholder="Explain why this request is being rejected..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {selectedRequest.status === "pending" && (
              <div className="flex gap-3 p-6 border-t bg-muted/30 sticky bottom-0">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={!rejectReason.trim() || processing}
                  onClick={() => handleReject(selectedRequest)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  disabled={processing}
                  onClick={() => handleAccept(selectedRequest)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            )}

            {selectedRequest.status !== "pending" && (
              <div className="flex gap-3 p-6 border-t bg-muted/30">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSelectedRequest(null); setRejectReason("") }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { window.location.href = `/admin/jobs` }}
                >
                  View Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
