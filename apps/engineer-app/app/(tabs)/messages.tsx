import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Conversation {
  user_id: string;
  full_name: string | null;
  role: string;
  last_message: string | null;
  unread_count: number;
}

interface MessageData {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string | null;
  created_at: string;
  is_read: boolean;
}

const COLORS = {
  primary: '#1E3A5F',
  background: '#FFFFFF',
  backgroundSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
};

export default function MessagesScreen() {
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    const { data: msgData } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, message_text, created_at')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const userMap = new Map<string, Conversation>();
    for (const msg of msgData || []) {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!userMap.has(otherId)) {
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', otherId).single();
        userMap.set(otherId, {
          user_id: otherId,
          full_name: (profile as any)?.full_name || 'Unknown',
          role: (profile as any)?.role || 'user',
          last_message: msg.message_text,
          unread_count: 0,
        });
      }
    }

    for (const [otherId] of userMap) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('sender_id', otherId)
        .eq('is_read', false);
      const conv = userMap.get(otherId)!;
      conv.unread_count = count || 0;
    }

    setConversations(Array.from(userMap.values()));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchConversations() }, [fetchConversations]);

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !user?.id) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', selectedUser)
      .eq('is_read', false);
  }, [selectedUser, user?.id]);

  useEffect(() => { fetchMessages() }, [fetchMessages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser || !user?.id) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedUser,
      message_text: messageText.trim(),
    });
    setMessageText('');
    setSending(false);
    fetchMessages();
    fetchConversations();
  };

  const selectedProfile = conversations.find((c) => c.user_id === selectedUser);

  if (!selectedUser) {
    return (
      <View style={s.container}>
        <View style={s.header}><Text style={s.headerTitle}>Messages</Text></View>
        {loading ? (
          <View style={s.center}><Text>Loading...</Text></View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.convItem} onPress={() => setSelectedUser(item.user_id)}>
                <View style={s.avatar}><Ionicons name="person" size={20} color={COLORS.primary} /></View>
                <View style={s.convInfo}>
                  <Text style={s.convName}>{item.full_name}</Text>
                  <Text style={s.role}>{item.role}</Text>
                  <Text style={s.lastMsg}>{item.last_message || 'No messages'}</Text>
                </View>
                {item.unread_count > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{item.unread_count}</Text></View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={s.center}><Text style={s.emptyText}>No conversations</Text></View>}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container} keyboardVerticalOffset={90}>
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedUser(null)} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={s.chatInfo}>
          <Text style={s.chatName}>{selectedProfile?.full_name || 'Unknown'}</Text>
          <Text style={s.chatRole}>{selectedProfile?.role}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
              <Text style={[s.msgText, isMe ? s.myMsgText : s.theirMsgText]}>{item.message_text}</Text>
              <Text style={[s.msgTime, isMe ? s.myMsgTime : s.theirMsgTime]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<View style={s.center}><Text style={s.emptyText}>No messages yet</Text></View>}
      />

      <View style={s.inputArea}>
        <TextInput
          style={s.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textTertiary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!messageText.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary },
  list: { padding: 16, paddingBottom: 100 },
  convItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F4FD', justifyContent: 'center', alignItems: 'center' },
  convInfo: { flex: 1, marginLeft: 12 },
  convName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  role: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  lastMsg: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { padding: 8 },
  chatInfo: { marginLeft: 12 },
  chatName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  chatRole: { fontSize: 12, color: COLORS.textSecondary },
  msgList: { padding: 16 },
  bubble: { maxWidth: '80%', marginBottom: 12, padding: 12, borderRadius: 16 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.background, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: '#FFFFFF' },
  theirMsgText: { color: COLORS.text },
  msgTime: { fontSize: 10, marginTop: 4 },
  myMsgTime: { color: 'rgba(255,255,255,0.7)' },
  theirMsgTime: { color: COLORS.textTertiary },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.backgroundSecondary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: COLORS.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
});
