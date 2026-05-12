import { View, ViewStyle } from 'react-native'
import { ReactNode } from 'react'
import { colors, spacing, borderRadius, elevation } from '../../theme'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  variant?: 'elevated' | 'outlined' | 'flat'
}

export default function Card({ children, style, variant = 'elevated' }: CardProps) {
  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: colors.surface, borderRadius: borderRadius.md,
      padding: spacing.md, marginBottom: spacing.sm + 4, ...elevation.low,
    },
    outlined: {
      backgroundColor: colors.surface, borderRadius: borderRadius.md,
      padding: spacing.md, marginBottom: spacing.sm + 4,
      borderWidth: 1, borderColor: colors.border,
    },
    flat: {
      backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md,
      padding: spacing.md, marginBottom: spacing.sm + 4,
    },
  }

  return <View style={[variantStyles[variant], style]}>{children}</View>
}
