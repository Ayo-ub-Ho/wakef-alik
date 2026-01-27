/**
 * Earnings Screen - Stitch Style Placeholder
 * Shows driver earnings summary
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { colors, typography, spacing } from '../../src/theme/tokens';

export default function EarningsScreen() {
  return (
    <AppScreen scroll tabBarPadding>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your delivery earnings</Text>
      </View>

      {/* Total Earnings Card - Featured */}
      <Card style={styles.totalCard} elevated>
        <Text style={styles.totalLabel}>THIS WEEK</Text>
        <Text style={styles.totalAmount}>0.00 MAD</Text>
        <Text style={styles.totalHint}>
          Complete deliveries to start earning
        </Text>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>0 MAD</Text>
          <Text style={styles.statLabel}>Today</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>🚚</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </Card>
      </View>

      <SectionHeader title="Recent Payouts" />

      {/* Empty State */}
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No earnings yet</Text>
        <Text style={styles.emptyText}>
          Your earnings from completed deliveries will appear here.
        </Text>
      </Card>

      {/* Tips Card */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Maximize your earnings</Text>
        <Text style={styles.tipsText}>
          • Stay online during peak hours (12-2pm, 7-10pm){'\n'}• Keep your GPS
          updated for more offers{'\n'}• Complete deliveries quickly for better
          ratings
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
  totalCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text,
    opacity: 0.7,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  totalHint: {
    fontSize: typography.size.sm,
    color: colors.text,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
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
  },
  tipsCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  tipsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
