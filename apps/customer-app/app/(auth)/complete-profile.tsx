import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components/ui';
import { validateName, validatePhone, validateEmail } from '../../lib/validation';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function CompleteProfileScreen() {
  const { user, setUser } = useAuthStore(useShallow((state) => ({ user: state.user, setUser: state.setUser })));
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleComplete = async () => {
    const nameResult = validateName(fullName);
    const phoneResult = validatePhone(phone);
    const fieldErrors: Record<string, string> = {};
    if (!nameResult.valid) fieldErrors.fullName = nameResult.error!;
    if (!phoneResult.valid) fieldErrors.phone = phoneResult.error!;
    if (email && !validateEmail(email).valid) fieldErrors.email = validateEmail(email).error!;

    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to continue.');
      return;
    }

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_URL}/api/customers/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email || null,
          phone: phone || null,
          address: address || null,
        }),
      });

      if (response.ok) {
        const updatedUser = { ...user, full_name: fullName, email, phone, address };
        setUser(updatedUser);
        router.replace('/(tabs)');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to save profile');
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
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Almost there!</Text>
          <Text style={styles.subtitle}>Complete your profile to get started</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
            autoCapitalize="words"
            error={errors.fullName}
          />

          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Phone"
            placeholder="+252 XX XXXXXX"
            value={phone}
            onChangeText={(v) => { setPhone(v); clearError('phone'); }}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Address"
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Ionicons name="checkmark" size={16} color={colors.background} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          <Button
            title="Get Started"
            onPress={handleComplete}
            loading={loading}
            disabled={!fullName || !termsAccepted || loading}
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
    marginBottom: 40,
  },
  checkIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...typography.heading1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
