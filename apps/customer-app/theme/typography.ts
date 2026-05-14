import { TextStyle } from 'react-native'

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  priceLarge: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
}
