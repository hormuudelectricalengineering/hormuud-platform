import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components/ui';
import { validateRequired, validatePassword, validatePasswordMatch } from '../../lib/validation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleChangePassword = async () => {
    const currentResult = validateRequired(currentPassword, 'Current password');
    const newPwResult = validatePassword(newPassword, 6);
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    const fieldErrors: Record<string, string> = {};

    if (!currentResult.valid) fieldErrors.currentPassword = currentResult.error!;
    if (!newPwResult.valid) fieldErrors.newPassword = newPwResult.error!;
    if (!matchResult.valid) fieldErrors.confirmPassword = matchResult.error!;

    if (currentPassword === newPassword && newPassword) {
      fieldErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/engineer/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Password changed successfully. Please sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                logout();
                router.replace('/(auth)/login');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Change Your Password</Text>
          <Text style={styles.subtitle}>
            This is your first login. Please set a new password to continue.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={(v) => { setCurrentPassword(v); clearError('currentPassword'); }}
            secureTextEntry
            error={errors.currentPassword}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); clearError('newPassword'); }}
            secureTextEntry
            error={errors.newPassword}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
            secureTextEntry
            error={errors.confirmPassword}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Change Password"
            onPress={handleChangePassword}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.sm,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
});
