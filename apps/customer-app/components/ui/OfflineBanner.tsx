import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { useNetworkStatus } from '../../lib/networkStatus'

export default function OfflineBanner() {
  const { isConnected } = useNetworkStatus()
  const translateY = useRef(new Animated.Value(-60)).current

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isConnected ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isConnected, translateY])

  if (isConnected) return null

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>!</Text>
        <Text style={styles.text}>You are offline — some features may be unavailable</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.warning,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    color: colors.warningDark,
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    color: colors.warningDark,
    fontSize: 13,
    lineHeight: 18,
  },
})
