/**
 * Restaurant History Screen - Stitch Style
 * Shows past delivery requests (completed and cancelled)
 */
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useRequestsStore } from '../../src/stores/requests.store';
import { DeliveryRequest, DeliveryStatus } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';

const STATUS_STYLES: Record<
  DeliveryStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING: { bg: colors.warningLight, text: colors.warning, label: 'Pending' },
  PROPOSED: { bg: colors.infoLight, text: colors.info, label: 'Proposed' },
  ACCEPTED: { bg: '#F3E5F5', text: '#7B1FA2', label: 'Accepted' },
  IN_DELIVERY: { bg: '#E0F7FA', text: '#0097A7', label: 'In Delivery' },
  DELIVERED: {
    bg: colors.successLight,
    text: colors.success,
    label: 'Delivered',
  },
  CANCELLED: {
    bg: colors.dangerLight,
    text: colors.danger,
    label: 'Cancelled',
  },
};

export default function RestaurantHistoryScreen() {
  const router = useRouter();
  const { requests, loading, error, fetchMyRequests, clearError } =
    useRequestsStore();
  const [refreshing, setRefreshing] = useState(false);

  // Filter history requests (DELIVERED + CANCELLED only)
  const historyRequests = useMemo(() => {
    return requests
      .filter(r => r.status === 'DELIVERED' || r.status === 'CANCELLED')
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
  }, [requests]);

  // Compute stats
  const stats = useMemo(() => {
    const completed = requests.filter(r => r.status === 'DELIVERED').length;
    const cancelled = requests.filter(r => r.status === 'CANCELLED').length;
    return { completed, cancelled };
  }, [requests]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchMyRequests();
    }, [fetchMyRequests]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests();
    setRefreshing(false);
  };

  const handleRequestPress = (request: DeliveryRequest) => {
    router.push({
      pathname: `/restaurant/requests/[id]` as const,
      params: {
        id: request._id,
        data: JSON.stringify(request),
      },
    });
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

  const renderHistoryItem = ({ item }: { item: DeliveryRequest }) => {
    const statusStyle = STATUS_STYLES[item.status];

    return (
      <TouchableOpacity onPress={() => handleRequestPress(item)}>
        <Card style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <Text
                style={[styles.statusBadgeText, { color: statusStyle.text }]}
              >
                {statusStyle.label}
              </Text>
            </View>
            <Text style={styles.feeText}>
              {Math.round(item.deliveryFee)} MAD
            </Text>
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

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>
              {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Track your past delivery requests</Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={fetchMyRequests}
          onDismiss={clearError}
        />
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statLabel}>Avg. Time</Text>
        </Card>
      </View>

      <SectionHeader title="Recent Requests" />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="📭"
        title="No request history"
        description="Your completed and cancelled requests will appear here."
        actionLabel="View Active Requests"
        onAction={() => router.push('/restaurant/requests' as Href)}
      />
    </View>
  );

  const renderFooter = () => (
    <Card style={styles.featureCard}>
      <Text style={styles.featureTitle}>📈 Coming Soon</Text>
      <Text style={styles.featureText}>
        • Detailed delivery statistics{'\n'}• Weekly/monthly summaries{'\n'}•
        Export reports (CSV/PDF){'\n'}• Performance insights
      </Text>
    </Card>
  );

  // Show loading only on initial load
  if (loading && requests.length === 0 && !refreshing) {
    return (
      <AppScreen noPadding tabBarPadding>
        <View style={styles.headerPadding}>
          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
              Track your past delivery requests
            </Text>
          </View>
        </View>
        <LoadingView text="Loading history..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen noPadding tabBarPadding>
      <FlatList
        data={historyRequests}
        keyExtractor={item => item._id}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={historyRequests.length > 0 ? renderFooter : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: spacing.lg,
  },
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
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
  requestCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
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
    marginBottom: spacing.sm,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: spacing.md,
  },
  locationAddress: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.muted,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  emptyContainer: {
    marginTop: spacing.xl,
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
