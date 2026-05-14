"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Search, Send, User, MessageSquare, Reply, Pencil, Trash2, X, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  reply_to_id: string | null
  edited_at: string | null
  is_deleted: boolean
  created_at: string
  is_read: boolean
}

export default function AdminMessagesPage() {
  const [supabase] = useState(() => createClient())

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminId(data.user?.id || null)
    })
  }, [supabase])

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
    const channel = supabase
      .channel("admin-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations()
        fetchMessages()
      })
      .subscribe()
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [fetchMessages, fetchConversations])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser || !adminId) return
    setSending(true)
    const payload: Record<string, any> = {
      sender_id: adminId,
      recipient_id: selectedUser,
      message_text: messageText.trim(),
    }
    if (replyingTo) {
      payload.reply_to_id = replyingTo.id
    }
    await supabase.from("messages").insert(payload)
    setMessageText("")
    setReplyingTo(null)
    setSending(false)
    fetchMessages()
  }

  const handleEdit = async (msg: MessageData) => {
    if (!editText.trim()) return
    setSavingEdit(true)
    const { error } = await supabase
      .from("messages")
      .update({ message_text: editText.trim(), edited_at: new Date().toISOString() })
      .eq("id", msg.id)
    if (error) {
      toast.error("Failed to edit message")
    } else {
      toast.success("Message edited")
      setEditingId(null)
      setEditText("")
      fetchMessages()
    }
    setSavingEdit(false)
  }

  const handleDelete = async (msg: MessageData) => {
    setDeleting(true)
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", msg.id)
    if (error) {
      toast.error("Failed to delete message")
    } else {
      toast.success("Message deleted")
      setDeletingId(null)
      fetchMessages()
    }
    setDeleting(false)
  }

  const startEdit = (msg: MessageData) => {
    setEditingId(msg.id)
    setEditText(msg.message_text || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const findRepliedMessage = (replyToId: string): MessageData | undefined => {
    return messages.find(m => m.id === replyToId)
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
                  messages.filter(m => !m.is_deleted || m.sender_id === adminId).map(msg => {
                    const isAdmin = msg.sender_id === adminId
                    const repliedTo = msg.reply_to_id ? findRepliedMessage(msg.reply_to_id) : null
                    const isEditing = editingId === msg.id

                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"} group`}>
                        <div className={`max-w-[70%] ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                          {repliedTo && (
                            <div className={`text-xs p-2 rounded-t-lg border-l-2 border-primary/40 bg-muted/50 mb-0.5 max-w-full ${isAdmin ? "text-right" : "text-left"}`}>
                              <p className="font-medium text-muted-foreground">
                                Replying to {repliedTo.sender_id === adminId ? "yourself" : selectedProfile?.full_name || "message"}
                              </p>
                              <p className="text-muted-foreground/70 truncate">{repliedTo.is_deleted ? "[deleted]" : repliedTo.message_text}</p>
                            </div>
                          )}

                          <div className={`p-3 rounded-lg text-sm ${
                            isAdmin
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          } ${msg.is_deleted ? "opacity-60 italic" : ""}`}>
                            {isEditing ? (
                              <div className="flex gap-2 items-center">
                                <Input
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  className="min-w-[200px] bg-background text-foreground"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80" onClick={() => handleEdit(msg)} disabled={savingEdit || !editText.trim()}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                {msg.is_deleted ? (
                                  <span className="italic opacity-70">[deleted]</span>
                                ) : (
                                  <p>{msg.message_text}</p>
                                )}
                                <div className={`flex items-center justify-between gap-2 mt-1`}>
                                  <p className={`text-xs ${
                                    isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.edited_at && !msg.is_deleted && <span className="ml-1 opacity-70">(edited)</span>}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {isAdmin && !msg.is_deleted && !isEditing && (
                            <div className="flex gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setReplyingTo(msg); setMessageText("") }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Reply"
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => startEdit(msg)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(msg.id)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t space-y-2">
                {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                    <Reply className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate flex-1">
                      Replying to: {replyingTo.message_text}
                    </span>
                    <button onClick={() => setReplyingTo(null)} className="p-0.5 hover:bg-background rounded text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
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

      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-destructive">Delete Message</h2>
              <button onClick={() => setDeletingId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t bg-muted/30">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleting} onClick={() => handleDelete(messages.find(m => m.id === deletingId)!)}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
