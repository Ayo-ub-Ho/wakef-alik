/**
 * Requests List Screen - Stitch Style with Active/History Tabs
 * Shows all delivery requests for the restaurant with segmented control
 */
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { DeliveryRequest, DeliveryStatus } from '../../../src/types/models';
import { AppScreen } from '../../../src/components/ui/AppScreen';
import { Card } from '../../../src/components/ui/Card';
import { LoadingView } from '../../../src/components/LoadingView';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { EmptyState } from '../../../src/components/EmptyState';
import { colors, typography, spacing, radius } from '../../../src/theme/tokens';

type TabType = 'active' | 'history';

const ACTIVE_STATUSES: DeliveryStatus[] = [
  'PENDING',
  'PROPOSED',
  'ACCEPTED',
  'IN_DELIVERY',
];
const HISTORY_STATUSES: DeliveryStatus[] = ['DELIVERED', 'CANCELLED'];

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

export default function RequestsListScreen() {
  const router = useRouter();
  const { requests, loading, error, fetchMyRequests, clearError } =
    useRequestsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Filter requests based on active tab
  const filteredRequests = useMemo(() => {
    const statuses =
      activeTab === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES;
    return requests
      .filter(r => statuses.includes(r.status))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [requests, activeTab]);

  // Count for tabs
  const activeCount = useMemo(
    () => requests.filter(r => ACTIVE_STATUSES.includes(r.status)).length,
    [requests],
  );
  const historyCount = useMemo(
    () => requests.filter(r => HISTORY_STATUSES.includes(r.status)).length,
    [requests],
  );

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

  const handleNewRequest = () => {
    router.push('/restaurant/requests/new' as Href);
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

  const isDriverAssigned = (item: DeliveryRequest) => {
    return (
      item.assignedDriverId != null ||
      ['ACCEPTED', 'IN_DELIVERY', 'DELIVERED'].includes(item.status)
    );
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

  const renderRequest = ({ item }: { item: DeliveryRequest }) => {
    const statusStyle = STATUS_STYLES[item.status];
    const driverAssigned = isDriverAssigned(item);

    return (
      <TouchableOpacity onPress={() => handleRequestPress(item)}>
        <Card style={styles.requestCard}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.badges}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.bg },
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: statusStyle.text }]}
                >
                  {statusStyle.label}
                </Text>
              </View>
              {driverAssigned && (
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedBadgeText}>✅ Assigned</Text>
                </View>
              )}
            </View>
            <Text style={styles.feeText}>
              {Math.round(item.deliveryFee)} MAD
            </Text>
          </View>

          {/* Locations */}
          <View style={styles.locationsSection}>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>🏪</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {item.pickupAddressText}
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>DROP-OFF</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {item.dropoffAddressText}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (activeTab === 'active') {
      return (
        <EmptyState
          icon="📦"
          title="No active requests"
          description="Create a new delivery request to get started"
          actionLabel="Create Request"
          onAction={handleNewRequest}
        />
      );
    }
    return (
      <EmptyState
        icon="📋"
        title="No request history"
        description="Your completed and cancelled requests will appear here"
        actionLabel="View Active"
        onAction={() => setActiveTab('active')}
      />
    );
  };

  // Show loading only on initial load
  if (loading && requests.length === 0 && !refreshing) {
    return (
      <AppScreen noPadding>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Delivery Requests</Text>
            <TouchableOpacity
              style={styles.newButton}
              onPress={handleNewRequest}
            >
              <Text style={styles.newButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
        </View>
        <LoadingView text="Loading requests..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen noPadding>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Delivery Requests</Text>
          <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {requests.length} total request{requests.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'active' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveTab('active')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'active' && styles.segmentTextActive,
              ]}
            >
              Active ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'history' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'history' && styles.segmentTextActive,
              ]}
            >
              History ({historyCount})
            </Text>
          </TouchableOpacity>
        </View>
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

      <FlatList
        data={filteredRequests}
        keyExtractor={item => item._id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  newButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  segmentedContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.bgDark,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
  errorPadding: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  assignedBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  assignedBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.success,
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: spacing.md,
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: typography.size.md,
    color: colors.text,
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
});
