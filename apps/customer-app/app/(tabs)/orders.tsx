import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LoadingSpinner, EmptyState } from '../../components/ui';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Order {
  id: string;
  service_category: string;
  status: string;
  address: string;
  created_at: string;
  engineer_id: string | null;
  service?: { name: string };
  engineer?: { full_name: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export default function OrdersScreen() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('jobs')
      .select('*, service:services(name), engineer:profiles!jobs_engineer_profile_id_fkey(full_name)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchOrders() }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleCancel = async (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', orderId);
          fetchOrders();
        },
      },
    ]);
  };

  const handleComplete = async (orderId: string) => {
    await supabase
      .from('jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), completed_by: 'customer' })
      .eq('id', orderId);
    fetchOrders();
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') return ['pending', 'assigned', 'in_progress'].includes(o.status);
    if (activeTab === 'completed') return o.status === 'completed';
    if (activeTab === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF' }]} />
        <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
      </View>
      <Text style={styles.serviceName}>{item.service?.name || item.service_category}</Text>
      <Text style={styles.address}>{item.address}</Text>
      {item.engineer?.full_name && (
        <Text style={styles.engineerName}>Engineer: {item.engineer.full_name}</Text>
      )}
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      {item.status === 'pending' && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)}>
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
      {item.status === 'in_progress' && (
        <TouchableOpacity style={styles.completeButton} onPress={() => handleComplete(item.id)}>
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <View style={styles.tabs}>
        {['active', 'completed', 'cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="list-outline"
              title="No orders found"
              message="Place an order from the Home tab"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.heading2, color: colors.text },
  tabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center', backgroundColor: colors.background },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  orderCard: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  statusText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  serviceName: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 4 },
  address: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  engineerName: { ...typography.caption, color: colors.primary, marginBottom: 4 },
  date: { ...typography.caption, color: colors.textTertiary },
  cancelButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
  cancelButtonText: { color: colors.error, fontWeight: '500' },
  completeButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: colors.success, alignItems: 'center' },
  completeButtonText: { color: colors.background, fontWeight: '500' },
});
