import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  style?: ViewStyle
}

const badgeStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.successDark },
  warning: { bg: colors.warningLight, text: colors.warningDark },
  error: { bg: colors.errorLight, text: colors.errorDark },
  info: { bg: colors.infoLight, text: colors.infoDark },
  default: { bg: colors.backgroundSecondary, text: colors.textSecondary },
}

export default function Badge({ label, variant = 'default', style }: BadgeProps) {
  const { bg, text } = badgeStyles[variant]

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm - 4,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
})
