import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover electrical services</Text>
      </View>

      <View style={styles.servicesGrid}>
        <View style={styles.serviceCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={28} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>Short Circuit</Text>
          <Text style={styles.serviceDesc}>Fix electrical shorts</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="git-network" size={28} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>Full Wiring</Text>
          <Text style={styles.serviceDesc}>Complete rewiring</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="settings" size={28} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>Appliance</Text>
          <Text style={styles.serviceDesc}>Repair & install</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="sunny" size={28} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>Solar</Text>
          <Text style={styles.serviceDesc}>Solar installation</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Browse services and book an engineer for any electrical job.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  serviceName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  serviceDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
});
