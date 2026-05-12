import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48
  const paddingHorizontal = size === 'sm' ? spacing.md : spacing.lg

  const containerStyle: ViewStyle = {
    height,
    paddingHorizontal,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  }

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.error,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  }

  const textVariantStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.textOnPrimary },
    secondary: { color: colors.text },
    danger: { color: colors.textOnPrimary },
    ghost: { color: colors.primary },
  }

  return (
    <TouchableOpacity
      style={[
        containerStyle,
        variantStyles[variant],
        (disabled || loading) && { opacity: 0.5, backgroundColor: disabled ? colors.disabled : undefined },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.textOnPrimary}
        />
      ) : (
        <Text
          style={[
            typography.button,
            textVariantStyles[variant],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}
