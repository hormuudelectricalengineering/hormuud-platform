import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LoadingSpinner, EmptyState } from '../../components/ui';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface JobItem {
  id: string;
  service_category: string;
  status: string;
  created_at: string;
  service?: { name: string };
}

export default function AccountScreen() {
  const { user, logout } = useAuthStore(useShallow((state) => ({ user: state.user, logout: state.logout })));
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, service:services(name)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setJobs(data || []);
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Customer'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {loading ? (
            <View style={styles.emptyJobs}><LoadingSpinner size="small" /></View>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <View key={job.id} style={styles.jobItem}>
                <View style={styles.jobIcon}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobService}>{job.service?.name || job.service_category}</Text>
                  <Text style={styles.jobDate}>{new Date(job.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.jobStatus}>{job.status}</Text>
              </View>
            ))
          ) : (
            <EmptyState icon="flash-outline" title="No orders yet" message="Place an order from the Home tab" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 2.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.heading2, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.md },
  profileCard: { backgroundColor: colors.background, borderRadius: spacing.md, padding: 20, alignItems: 'center', marginTop: spacing.md, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm + 4 },
  userName: { ...typography.heading3, color: colors.text },
  userPhone: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.sm + 4 },
  jobItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: spacing.sm + 4, marginBottom: spacing.sm },
  jobIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1, marginLeft: spacing.sm + 4 },
  jobService: { ...typography.bodySmall, fontWeight: '500', color: colors.text },
  jobDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  jobStatus: { ...typography.caption, color: colors.textTertiary },
  emptyJobs: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.lg, alignItems: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  menuItemText: { flex: 1, ...typography.bodySmall, color: colors.text, marginLeft: spacing.sm + 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginTop: 20, marginBottom: 20 },
  logoutText: { ...typography.bodySmall, color: colors.error, fontWeight: '500', marginLeft: spacing.sm },
  version: { textAlign: 'center', ...typography.caption, color: colors.textTertiary, marginBottom: 100 },
});
