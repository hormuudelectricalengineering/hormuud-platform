import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: ViewStyle
}

export default function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {helperText && !error && (
        <View style={styles.helperContainer}>
          <Text style={styles.helperText}>{helperText}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 44,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  helperContainer: {
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
})