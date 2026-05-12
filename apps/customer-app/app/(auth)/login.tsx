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
import { signInWithGoogle, isGoogleAuthAvailable } from '../../lib/google-auth';
import { colors, typography, spacing } from '../../theme';
import { Button, Input } from '../../components/ui';
import { validateEmail, validatePassword } from '../../lib/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setToken, setUser } = useAuthStore(useShallow((state) => ({ setToken: state.setToken, setUser: state.setUser })));
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEmailLogin = async () => {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password, 8);
    const fieldErrors: typeof errors = {};

    if (!emailResult.valid) fieldErrors.email = emailResult.error;
    if (!passwordResult.valid) fieldErrors.password = passwordResult.error;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          setToken(data.token);
        }
        if (data.user) {
          setUser(data.user);
        }
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

      if (result.token) {
        setToken(result.token);
      }
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
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="flash" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hormuud</Text>
          <Text style={styles.subtitle}>Find an Electrician</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>Sign in to continue</Text>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color={colors.primary} />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Login Form */}
          <View style={styles.emailForm}>
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={(v) => { setEmail(v); clearError('email'); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              containerStyle={{ marginBottom: spacing.md }}
            />
            
            <Input
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(v) => { setPassword(v); clearError('password'); }}
              secureTextEntry
              error={errors.password}
              containerStyle={{ marginBottom: spacing.md }}
            />

            <Button
              title="Sign In"
              onPress={handleEmailLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />
          </View>

          <TouchableOpacity
            style={styles.signUpLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.signUpText}>
              {"Don't have an account? "}<Text style={styles.signUpHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
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
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
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
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    ...typography.heading2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  googleButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    color: colors.textTertiary,
    ...typography.caption,
  },
  emailForm: {
    gap: spacing.sm + 4,
  },
  button: {
    marginTop: spacing.sm,
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signUpText: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  signUpHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  termsText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
