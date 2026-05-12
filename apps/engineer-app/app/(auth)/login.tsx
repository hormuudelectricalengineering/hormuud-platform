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
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { signInWithGoogle, isGoogleAuthAvailable } from '../../lib/google-auth';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components/ui';
import { validateEmail, validatePassword } from '../../lib/validation';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
  const { setToken, setUser } = useAuthStore(useShallow((state) => ({ setToken: state.setToken, setUser: state.setUser })));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleLogin = async () => {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password, 6);
    const fieldErrors: typeof errors = {};
    if (!emailResult.valid) fieldErrors.email = emailResult.error;
    if (!passwordResult.valid) fieldErrors.password = passwordResult.error;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/engineer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.session?.access_token) setToken(data.session.access_token);
        if (data.engineer) {
          setUser(data.engineer);
          useAuthStore.getState().setEngineer(data.engineer);
        }
        if (data.engineer?.must_change_password) {
          router.replace('/(auth)/change-password');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', data.error || 'Login failed');
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
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="construct" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hormuud</Text>
          <Text style={styles.subtitle}>Engineer Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome, Engineer!</Text>
          <Text style={styles.instructionText}>Sign in with your credentials</Text>

          <Input
            label="Email"
            placeholder="engineer@email.com"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password'); }}
            secureTextEntry
            error={errors.password}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginBottom: spacing.md }}
          />

          <TouchableOpacity
            style={styles.googleButton}
            onPress={async () => {
              if (!isGoogleAuthAvailable()) {
                Alert.alert(
                  'Google Sign-In',
                  'Google sign-in is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your environment variables or sign in with email.',
                  [{ text: 'OK' }]
                );
                return;
              }

              setLoading(true);
              try {
                const result = await signInWithGoogle();
                if (!result) {
                  setLoading(false);
                  return;
                }

                if (result.token) setToken(result.token);
                if (result.user) {
                  setUser(result.user);
                }
                router.replace('/(tabs)');
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
                Alert.alert('Error', message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color={colors.primary} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service
        </Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.primary,
    ...typography.button,
    marginLeft: spacing.sm,
  },
  termsText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
