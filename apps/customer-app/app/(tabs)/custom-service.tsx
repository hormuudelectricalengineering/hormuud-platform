import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
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

interface CustomRequest {
  id: string;
  description: string;
  estimated_budget: string | null;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#10B981',
  rejected: '#EF4444',
};

export default function CustomServiceScreen() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('custom_service_requests')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchRequests() }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the service you need');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('custom_service_requests').insert({
      customer_id: user?.id,
      description: description.trim(),
      estimated_budget: budget.trim() || null,
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setDescription('');
      setBudget('');
      fetchRequests();
    }
    setSubmitting(false);
  };

  const renderRequest = ({ item }: { item: CustomRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF' }]} />
        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#9CA3AF' }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <Text style={styles.requestDesc}>{item.description}</Text>
      {item.estimated_budget && <Text style={styles.budget}>Budget: {item.estimated_budget}</Text>}
      {item.admin_response && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Admin Response:</Text>
          <Text style={styles.responseText}>{item.admin_response}</Text>
        </View>
      )}
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Custom Service</Text>
        <Text style={styles.headerSubtitle}>Request a service not in our catalog</Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Describe what you need</Text>
            <TextInput
              style={styles.textArea}
              placeholder="I need solar panels installed on my roof..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <TextInput
              style={styles.budgetInput}
              placeholder="Estimated budget (e.g., $500-1000)"
              placeholderTextColor={colors.textTertiary}
              value={budget}
              onChangeText={setBudget}
            />
            <TouchableOpacity
              style={[styles.submitButton, (!description.trim() || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!description.trim() || submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="construct-outline"
              title="No requests yet"
              message="Submit a custom service request above"
            />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.heading2, color: colors.text },
  headerSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  list: { padding: spacing.md, paddingBottom: 100 },
  formCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  formTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  textArea: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm + 4, ...typography.bodySmall, color: colors.text, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.sm },
  budgetInput: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm + 4, ...typography.bodySmall, color: colors.text, marginBottom: spacing.sm },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: spacing.sm + 4, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.background, fontWeight: '600' },
  requestCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  statusText: { ...typography.caption, fontWeight: '600' },
  requestDesc: { ...typography.bodySmall, color: colors.text, marginBottom: 4 },
  budget: { ...typography.caption, color: colors.primary, marginBottom: 4 },
  responseBox: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm },
  responseLabel: { ...typography.caption, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  responseText: { ...typography.bodySmall, color: colors.text },
  date: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },
});
