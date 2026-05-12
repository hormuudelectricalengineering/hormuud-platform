import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';
import { colors, typography, spacing } from '../../theme';
import { LoadingSpinner, EmptyState, Badge } from '../../components/ui';
import { logger } from '../../lib/logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AssignedJob {
  id: string;
  status: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  time_preference: string | null;
  assigned_at: string;
  created_at: string;
  service: { name: string } | null;
  customer: { full_name: string | null; phone: string | null } | null;
}

export default function JobsScreen() {
  const { token, user } = useAuthStore(useShallow((state) => ({ token: state.token, user: state.user })));
  const { isOnline, toggleOnline, currentJobId } = useJobStore(useShallow((state) => ({ isOnline: state.isOnline, toggleOnline: state.toggleOnline, currentJobId: state.currentJobId })));

  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getLocation();
    fetchAssignedJobs();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } catch (error) {
      logger.error('Location error:', error);
    }
  };

  const fetchAssignedJobs = async () => {
    try {
      const engineerId = user?.id;
      if (!engineerId) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          service:services(name),
          customer:profiles!jobs_customer_id_fkey(full_name, phone)
        `)
        .eq('engineer_id', engineerId)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      logger.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignedJobs();
  };

  const handleToggleOnline = async () => {
    toggleOnline();
  };

  const handleAcceptJob = async (jobId: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('engineer_id', user?.id)
      .eq('status', 'assigned');

    if (error) {
      Alert.alert('Error', 'Failed to accept job');
    } else {
      fetchAssignedJobs();
    }
  };

  const handleDeclineJob = async (jobId: string) => {
    Alert.alert(
      'Decline Job',
      'Are you sure you want to decline this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('jobs')
              .update({ status: 'pending', engineer_id: null, updated_at: new Date().toISOString() })
              .eq('id', jobId)
              .eq('engineer_id', user?.id)
              .eq('status', 'assigned');

            if (error) {
              Alert.alert('Error', 'Failed to decline job');
            } else {
              fetchAssignedJobs();
            }
          },
        },
      ]
    );
  };

  const handleCompleteJob = async (jobId: string) => {
    Alert.alert(
      'Complete Job',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            const { error } = await supabase
              .from('jobs')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                completed_by: 'engineer',
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobId)
              .eq('engineer_id', user?.id)
              .in('status', ['assigned', 'in_progress']);

            if (error) {
              Alert.alert('Error', 'Failed to complete job');
            } else {
              fetchAssignedJobs();
            }
          },
        },
      ]
    );
  };

  const activeCount = jobs.filter((j) => j.status === 'in_progress').length;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'assigned':
        return { variant: 'warning' as const, text: 'Awaiting Response' };
      case 'in_progress':
        return { variant: 'info' as const, text: 'In Progress' };
      default:
        return { variant: 'default' as const, text: status };
    }
  };

  const renderJobCard = useCallback(({ item }: { item: AssignedJob }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobCardHeader}>
          <Badge label={statusInfo.text} variant={statusInfo.variant} />
        </View>

        <Text style={styles.serviceType}>{item.service?.name || 'Service'}</Text>

        <View style={styles.jobInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.customer?.full_name || 'Customer'}</Text>
          </View>
          {item.customer?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{item.customer.phone}</Text>
            </View>
          )}
          {item.description && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={2}>{item.description}</Text>
            </View>
          )}
        </View>

        {item.status === 'assigned' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDeclineJob(item.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptJob(item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'in_progress' && (
          <TouchableOpacity style={styles.completeButton} onPress={() => handleCompleteJob(item.id)}>
            <Text style={styles.completeButtonText}>Mark Complete ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, []);

  const renderEmpty = () => (
    <EmptyState
      icon="mail-outline"
      title="No jobs yet"
      message="Go online to receive job assignments"
    />
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Your Jobs</Text>
          <TouchableOpacity
            style={[styles.onlineToggle, isOnline ? styles.onlineActive : styles.onlineInactive]}
            onPress={handleToggleOnline}
          >
            <View style={[styles.dot, isOnline ? styles.dotGreen : styles.dotRed]} />
            <Text style={[styles.toggleText, isOnline ? styles.textGreen : styles.textRed]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        windowSize={5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineActive: {
    backgroundColor: colors.successLight,
  },
  onlineInactive: {
    backgroundColor: colors.errorLight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: colors.success,
  },
  dotRed: {
    backgroundColor: colors.error,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textGreen: {
    color: colors.successDark,
  },
  textRed: {
    color: colors.errorDark,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm + 4,
  },
  jobInfo: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm + 4,
  },
  declineButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  declineButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.success,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  startButton: {
    marginTop: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
  },
  startButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  completeButton: {
    marginTop: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: spacing.sm,
  },
  completeButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
