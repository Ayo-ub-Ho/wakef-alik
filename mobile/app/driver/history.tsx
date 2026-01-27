/**
 * History Screen - Stitch Style Placeholder
 * Shows past delivery history
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll tabBarPadding>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>View your past deliveries</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statLabel}>Avg. Time</Text>
        </Card>
      </View>

      <SectionHeader title="Recent Deliveries" />

      {/* Empty State */}
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🚚</Text>
        <Text style={styles.emptyTitle}>No delivery history</Text>
        <Text style={styles.emptyText}>
          Your completed and cancelled deliveries will appear here.
        </Text>
        <SecondaryButton
          title="View Active Deliveries"
          onPress={() => router.push('/driver/deliveries')}
          style={styles.emptyButton}
        />
      </Card>

      {/* Feature Preview */}
      <Card style={styles.featureCard}>
        <Text style={styles.featureTitle}>📈 Coming Soon</Text>
        <Text style={styles.featureText}>
          • Detailed delivery statistics{'\n'}• Weekly/monthly summaries{'\n'}•
          Performance insights{'\n'}• Export delivery reports
        </Text>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  featureCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgDark,
  },
  featureTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.size.sm,
    color: colors.muted,
    lineHeight: 22,
  },
});
