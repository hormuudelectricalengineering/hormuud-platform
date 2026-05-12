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
import { colors, typography, spacing } from '../../theme';
import { LoadingSpinner, EmptyState } from '../../components/ui';
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
      .select('sender_id, recipient_id, message_text, created_at, profiles!messages_sender_id_fkey(full_name, role)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const userMap = new Map<string, Conversation>();
    for (const msg of msgData || []) {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!userMap.has(otherId)) {
        const profile = msg.sender_id === user.id ? null : (msg as any).profiles;
        const { data: otherProfile } = profile ? { data: profile } : await supabase.from('profiles').select('full_name, role').eq('id', otherId).single();
        userMap.set(otherId, {
          user_id: otherId,
          full_name: (otherProfile as any)?.full_name || 'Unknown',
          role: (otherProfile as any)?.role || 'user',
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.convItem} onPress={() => setSelectedUser(item.user_id)}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convName}>{item.full_name}</Text>
                  <Text style={styles.convLastMsg}>{item.last_message || 'No messages'}</Text>
                </View>
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <EmptyState icon="chatbubbles-outline" title="No conversations" message="Start chatting from an order or contact admin" />
            }
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container} keyboardVerticalOffset={90}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{selectedProfile?.full_name || 'Unknown'}</Text>
          <Text style={styles.chatHeaderRole}>{selectedProfile?.role}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.message_text}
              </Text>
              <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="chatbubble-ellipses-outline" title="No messages yet" message="Start the conversation!" />
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          <Ionicons name="send" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.heading2, color: colors.text },
  list: { padding: spacing.md, paddingBottom: 100 },
  convItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  convInfo: { flex: 1, marginLeft: spacing.sm + 4 },
  convName: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  convLastMsg: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: spacing.sm + 4, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: spacing.sm },
  chatHeaderInfo: { marginLeft: spacing.sm + 4 },
  chatHeaderName: { fontSize: 18, fontWeight: '600', color: colors.text },
  chatHeaderRole: { ...typography.caption, color: colors.textSecondary },
  messagesList: { padding: spacing.md, paddingBottom: spacing.sm },
  messageBubble: { maxWidth: '80%', marginBottom: spacing.sm + 4, padding: spacing.sm + 4, borderRadius: 16 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: colors.background, borderBottomLeftRadius: 4 },
  messageText: { ...typography.bodySmall, lineHeight: 20 },
  myMessageText: { color: colors.background },
  theirMessageText: { color: colors.text },
  messageTime: { fontSize: 10, marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  theirMessageTime: { color: colors.textTertiary },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm + 4, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 10, ...typography.bodySmall, maxHeight: 100, color: colors.text },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
  sendButtonDisabled: { opacity: 0.5 },
});
