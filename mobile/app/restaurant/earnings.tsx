/**
 * Restaurant Earnings Screen - Stitch Style
 * Shows aggregated metrics computed client-side from requests
 */
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRequestsStore } from '../../src/stores/requests.store';
import { DeliveryRequest } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';

type FilterRange = 'today' | '7days' | '30days' | 'all';

const FILTER_OPTIONS: { key: FilterRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7days', label: '7 days' },
  { key: '30days', label: '30 days' },
  { key: 'all', label: 'All' },
];

/**
 * Get start date based on filter range
 */
function getFilterStartDate(range: FilterRange): Date | null {
  const now = new Date();

  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7days':
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return week;
    case '30days':
      const month = new Date(now);
      month.setDate(month.getDate() - 30);
      return month;
    case 'all':
      return null;
  }
}

/**
 * Filter requests by date range
 */
function filterByDateRange(
  requests: DeliveryRequest[],
  range: FilterRange,
): DeliveryRequest[] {
  const startDate = getFilterStartDate(range);
  if (!startDate) return requests;

  return requests.filter(r => new Date(r.createdAt) >= startDate);
}

/**
 * Calculate earnings metrics from requests
 */
function calculateMetrics(requests: DeliveryRequest[]) {
  const delivered = requests.filter(r => r.status === 'DELIVERED');
  const cancelled = requests.filter(r => r.status === 'CANCELLED');

  const totalEarnings = delivered.reduce((sum, r) => sum + r.deliveryFee, 0);
  const avgFee = delivered.length > 0 ? totalEarnings / delivered.length : 0;

  return {
    totalEarnings: Math.round(totalEarnings),
    deliveredCount: delivered.length,
    cancelledCount: cancelled.length,
    avgFee: Math.round(avgFee),
    recentDelivered: delivered
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10),
  };
}

export default function EarningsScreen() {
  const { requests, loading, error, fetchMyRequests, clearError } =
    useRequestsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterRange>('30days');

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchMyRequests();
    }, [fetchMyRequests]),
  );

  // Filter and compute metrics
  const filteredRequests = useMemo(
    () => filterByDateRange(requests, activeFilter),
    [requests, activeFilter],
  );

  const metrics = useMemo(
    () => calculateMetrics(filteredRequests),
    [filteredRequests],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDeliveredItem = ({ item }: { item: DeliveryRequest }) => (
    <Card style={styles.deliveredCard}>
      <View style={styles.cardHeader}>
        <View style={styles.deliveredBadge}>
          <Text style={styles.deliveredBadgeText}>Delivered</Text>
        </View>
        <Text style={styles.feeText}>{Math.round(item.deliveryFee)} MAD</Text>
      </View>

      <View style={styles.locationsSection}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🏪</Text>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.pickupAddressText}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.dropoffAddressText}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
    </Card>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="📊"
      title="No earnings data"
      description={`No delivered or cancelled requests in the selected period`}
    />
  );

  // Show loading only on initial load
  if (loading && requests.length === 0 && !refreshing) {
    return (
      <AppScreen noPadding>
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
        </View>
        <LoadingView text="Loading earnings..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen noPadding>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>Track your delivery performance</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterPill,
                  activeFilter === option.key && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(option.key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === option.key && styles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {error && (
          <View style={styles.errorPadding}>
            <ErrorBanner
              message={error}
              onRetry={fetchMyRequests}
              onDismiss={clearError}
            />
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <SectionHeader title="Summary" emoji="💰" />

          {/* Main Earnings Card */}
          <Card style={styles.mainEarningsCard}>
            <Text style={styles.mainEarningsLabel}>Total Earnings</Text>
            <Text style={styles.mainEarningsValue}>
              {metrics.totalEarnings} MAD
            </Text>
          </Card>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{metrics.deliveredCount}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {metrics.cancelledCount}
              </Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{metrics.avgFee}</Text>
              <Text style={styles.statLabel}>Avg Fee</Text>
            </Card>
          </View>
        </View>

        {/* Recent Delivered */}
        <View style={styles.recentSection}>
          <SectionHeader title="Recent Delivered" emoji="✅" />

          {metrics.recentDelivered.length > 0 ? (
            <FlatList
              data={metrics.recentDelivered}
              keyExtractor={item => item._id}
              renderItem={renderDeliveredItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            renderEmpty()
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl + 60,
  },
  header: {
    paddingHorizontal: spacing.lg,
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
  filterContainer: {
    marginBottom: spacing.lg,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgDark,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterPillText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  filterPillTextActive: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
  errorPadding: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summarySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  mainEarningsCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  mainEarningsLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  mainEarningsValue: {
    fontSize: typography.size.xxxl + 8,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
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
    fontSize: typography.size.sm,
    color: colors.muted,
    fontWeight: typography.weight.medium,
  },
  recentSection: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    gap: spacing.md,
  },
  deliveredCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deliveredBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  deliveredBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feeText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  locationsSection: {
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  locationAddress: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: typography.size.sm,
    color: colors.muted,
    textAlign: 'right',
  },
});
