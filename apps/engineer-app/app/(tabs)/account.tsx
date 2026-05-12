import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { colors, typography, spacing } from '../../theme';
import { Card, LoadingSpinner } from '../../components/ui';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function AccountScreen() {
  const { user, token, logout } = useAuthStore((state) => state);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialties, setSpecialties] = useState('');
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    fetchJobCount();
    if (user?.specialties) {
      setSpecialties(Array.isArray(user.specialties) ? user.specialties.join(', ') : '');
    }
  }, []);

  const fetchJobCount = async () => {
    if (!user?.id) return;
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('engineer_id', user.id);
    setJobCount(count || 0);
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

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);

    const specialtiesArray = specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        specialties: specialtiesArray,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      useAuthStore.getState().setUser({ ...user, full_name: fullName, phone, specialties: specialtiesArray });
      Alert.alert('Success', 'Profile updated');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Enter your current and new password',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            Alert.prompt?.(
              'Current Password',
              'Enter current password',
              async (currentPassword) => {
                Alert.prompt?.(
                  'New Password',
                  'Enter new password (min 8 characters)',
                  async (newPassword) => {
                    if (!newPassword || newPassword.length < 8) {
                      Alert.alert('Error', 'Password must be at least 8 characters');
                      return;
                    }
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/engineer/change-password`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ currentPassword, newPassword }),
                      });
                      if (response.ok) {
                        Alert.alert('Success', 'Password changed successfully');
                      } else {
                        const data = await response.json();
                        Alert.alert('Error', data.error || 'Failed to change password');
                      }
                    } catch {
                      Alert.alert('Error', 'Network error');
                    }
                  }
                );
              }
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Engineer'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>

          <View style={styles.verificationBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.verificationText}>Verified</Text>
          </View>

          {user?.license && (
            <View style={styles.licenseRow}>
              <Text style={styles.licenseLabel}>License:</Text>
              <Text style={styles.licenseValue}>{user.license}</Text>
            </View>
          )}
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statBox} variant="elevated">
            <Text style={styles.statValue}>{jobCount}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </Card>
          <Card style={styles.statBox} variant="elevated">
            <Text style={styles.statValue}>{user?.role || 'engineer'}</Text>
            <Text style={styles.statLabel}>Role</Text>
          </Card>
        </View>

        {editing ? (
          <Card style={styles.editCard}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Specialties (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="AC Repair, Wiring, Solar"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <LoadingSpinner size="small" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setEditing(true)}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Notification Preferences</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Availability Schedule</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

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
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  userName: {
    ...typography.heading3,
    color: colors.text,
  },
  userPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    backgroundColor: colors.successLight,
    borderRadius: 16,
  },
  verificationText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm + 4,
  },
  licenseLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  licenseValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    ...typography.heading2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  editCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    padding: spacing.sm + 4,
    ...typography.bodySmall,
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm + 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  version: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: 100,
  },
});
