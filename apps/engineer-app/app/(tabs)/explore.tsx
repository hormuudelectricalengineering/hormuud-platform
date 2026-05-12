import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Card } from '../../components/ui';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Ionicons name="compass" size={48} color={colors.primary} />
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
      <Card variant="outlined" style={styles.card}>
        <Ionicons name="construct-outline" size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>Services</Text>
        <Text style={styles.cardText}>Browse available electrical services and pricing.</Text>
      </Card>
      <Card variant="outlined" style={styles.card}>
        <Ionicons name="map-outline" size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>Nearby Jobs</Text>
        <Text style={styles.cardText}>See job opportunities in your area.</Text>
      </Card>
      <Card variant="outlined" style={styles.card}>
        <Ionicons name="school-outline" size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>Training</Text>
        <Text style={styles.cardText}>Access training materials and guides.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.sm,
  },
  title: {
    ...typography.heading1,
    color: colors.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  card: {
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.heading3,
    color: colors.text,
    marginTop: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  cardText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
