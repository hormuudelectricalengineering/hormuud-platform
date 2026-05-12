"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Search, Send, User, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Conversation {
  user_id: string
  full_name: string | null
  phone: string | null
  role: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

interface MessageData {
  id: string
  sender_id: string
  recipient_id: string
  message_text: string | null
  created_at: string
  is_read: boolean
}

const supabase = createClient()

async function getAdminId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    getAdminId().then(setAdminId)
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!adminId) return
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .in("role", ["customer", "engineer"])
      .order("full_name", { ascending: true })

    const profileList = profiles || []
    const convs: Conversation[] = []

    for (const p of profileList) {
      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", adminId)
        .eq("sender_id", p.id)
        .eq("is_read", false)

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("message_text, created_at")
        .or(`and(sender_id.eq.${adminId},recipient_id.eq.${p.id}),and(sender_id.eq.${p.id},recipient_id.eq.${adminId})`)
        .order("created_at", { ascending: false })
        .limit(1)

      convs.push({
        user_id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        role: p.role,
        last_message: lastMsg?.[0]?.message_text || null,
        last_message_at: lastMsg?.[0]?.created_at || null,
        unread_count: unread || 0,
      })
    }

    convs.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1
      if (a.unread_count === 0 && b.unread_count > 0) return 1
      return 0
    })

    setConversations(convs)
    setLoading(false)
  }, [adminId])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !adminId) return
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},recipient_id.eq.${adminId})`)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    scrollToBottom()

    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_id", adminId)
      .eq("sender_id", selectedUser)
      .eq("is_read", false)

    fetchConversations()
  }, [selectedUser, adminId, fetchConversations])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser || !adminId) return
    setSending(true)
    await supabase.from("messages").insert({
      sender_id: adminId,
      recipient_id: selectedUser,
      message_text: messageText.trim(),
    })
    setMessageText("")
    setSending(false)
    fetchMessages()
  }

  const filteredConvs = conversations.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.role.includes(search.toLowerCase())
  )

  const selectedProfile = conversations.find(c => c.user_id === selectedUser)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with customers and engineers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations</div>
            ) : filteredConvs.map(conv => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedUser(conv.user_id)}
                className={`w-full p-4 flex items-start gap-3 border-b hover:bg-muted/50 transition-colors text-left ${
                  selectedUser === conv.user_id ? "bg-muted/50" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.full_name || "Unknown"}</p>
                    <Badge variant="outline" className="text-xs ml-1">{conv.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message || "No messages yet"}</p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs flex items-center justify-center">
                    {conv.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedProfile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedProfile?.role} · {selectedProfile?.phone}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No messages yet. Send a message to start.</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === adminId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                        msg.sender_id === adminId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p>{msg.message_text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === adminId ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                  <Input value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1" />
                  <Button type="submit" disabled={!messageText.trim() || sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
