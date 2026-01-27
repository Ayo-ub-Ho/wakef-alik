/**
 * Deliveries Screen - Stitch Style
 * Shows active deliveries for the driver
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { ActiveDelivery, DeliveryStatus } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';
import { AxiosError } from 'axios';

const STATUS_STYLES: Record<
  DeliveryStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING: { bg: colors.warningLight, text: colors.warning, label: 'Pending' },
  PROPOSED: { bg: colors.infoLight, text: colors.info, label: 'Proposed' },
  ACCEPTED: {
    bg: '#F3E5F5',
    text: colors.statusAccepted,
    label: 'Ready to Start',
  },
  IN_DELIVERY: {
    bg: '#E0F7FA',
    text: colors.statusInDelivery,
    label: 'In Progress',
  },
  DELIVERED: {
    bg: colors.successLight,
    text: colors.success,
    label: 'Completed',
  },
  CANCELLED: {
    bg: colors.dangerLight,
    text: colors.danger,
    label: 'Cancelled',
  },
};

export default function DeliveriesScreen() {
  const router = useRouter();
  const {
    activeDeliveries,
    loading,
    error,
    loadActiveDeliveries,
    updateStatus,
    clearError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadActiveDeliveries();
    }, [loadActiveDeliveries]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveDeliveries();
    setRefreshing(false);
  };

  /**
   * Get user-friendly error message from API error
   */
  const getErrorMessage = (err: unknown): string => {
    const axiosError = err as AxiosError<{ message?: string; error?: string }>;

    if (axiosError.response?.status === 400) {
      const msg =
        axiosError.response?.data?.message || axiosError.response?.data?.error;
      if (msg) return msg;
      return 'Invalid request. The delivery may have already been updated.';
    }
    if (axiosError.response?.status === 403) {
      return 'You are not authorized to update this delivery.';
    }
    if (axiosError.response?.status === 404) {
      return 'Delivery not found. It may have been cancelled.';
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    return 'Failed to update delivery status. Please try again.';
  };

  /**
   * Get the request ID from a delivery object
   */
  const getRequestId = (delivery: ActiveDelivery): string => {
    if (delivery.request?._id) {
      return delivery.request._id;
    }
    return delivery._id;
  };

  const handleStartDelivery = (delivery: ActiveDelivery) => {
    const requestId = getRequestId(delivery);
    Alert.alert('Start Delivery', 'Are you ready to start this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          setProcessingId(delivery._id);
          try {
            await updateStatus(requestId, 'IN_DELIVERY');
            Alert.alert('Success', 'Delivery started!');
          } catch (err) {
            console.error('Start delivery failed:', err);
            const message = getErrorMessage(err);
            Alert.alert('Failed to Start Delivery', message, [
              { text: 'OK', onPress: () => loadActiveDeliveries() },
            ]);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleMarkDelivered = (delivery: ActiveDelivery) => {
    const requestId = getRequestId(delivery);
    Alert.alert('Complete Delivery', 'Has this delivery been completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Completed',
        onPress: async () => {
          setProcessingId(delivery._id);
          try {
            await updateStatus(requestId, 'DELIVERED');
            Alert.alert('Success', 'Delivery marked as completed!');
          } catch (err) {
            console.error('Mark delivered failed:', err);
            const message = getErrorMessage(err);
            Alert.alert('Failed to Complete Delivery', message, [
              { text: 'OK', onPress: () => loadActiveDeliveries() },
            ]);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const renderDelivery = ({ item }: { item: ActiveDelivery }) => {
    const request = item.request || item;
    const status: DeliveryStatus =
      (request as any)?.status || item.status || 'ACCEPTED';

    const restaurantName =
      (request as any)?.restaurantId?.restaurantName ||
      (request as any)?.restaurant?.restaurantName ||
      'Restaurant';

    const pickupAddress = (request as any)?.pickupAddressText || 'N/A';
    const dropoffAddress = (request as any)?.dropoffAddressText || 'N/A';
    const deliveryFee = (request as any)?.deliveryFee || 0;

    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.ACCEPTED;
    const isProcessing = processingId === item._id;

    return (
      <Card style={styles.deliveryCard}>
        {/* Header with status badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Fee */}
        <View style={styles.feeRow}>
          <Text style={styles.feeAmount}>{Math.round(deliveryFee)} MAD</Text>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
        </View>

        {/* Locations */}
        <View style={styles.locationsSection}>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🏪</Text>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {pickupAddress}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>DROP-OFF</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {dropoffAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {status === 'ACCEPTED' && (
          <View style={styles.actionRow}>
            <PrimaryButton
              title="🚚 Start Delivery"
              onPress={() => handleStartDelivery(item)}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.actionButton}
            />
          </View>
        )}

        {status === 'IN_DELIVERY' && (
          <View style={styles.actionRow}>
            <PrimaryButton
              title="✅ Mark Delivered"
              onPress={() => handleMarkDelivered(item)}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.actionButton}
            />
          </View>
        )}

        {status === 'DELIVERED' && (
          <View style={styles.completedRow}>
            <Text style={styles.completedIcon}>✓</Text>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🚚</Text>
        <Text style={styles.emptyTitle}>No active deliveries</Text>
        <Text style={styles.emptyText}>Accept offers to start delivering</Text>
        <PrimaryButton
          title="Check Inbox"
          onPress={() => router.push('/driver/inbox')}
          style={styles.emptyButton}
        />
      </Card>
    </View>
  );

  // Count active (non-completed) deliveries
  const activeCount = activeDeliveries.filter(d => {
    const status = (d.request as any)?.status || (d as any).status;
    return status !== 'DELIVERED' && status !== 'CANCELLED';
  }).length;

  return (
    <AppScreen tabBarPadding noPadding>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>My Deliveries</Text>
        <Text style={styles.subtitle}>
          {activeCount > 0
            ? `${activeCount} active delivery${activeCount !== 1 ? 'ies' : ''}`
            : 'No active deliveries'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorPadding}>
          <ErrorBanner
            message={error}
            onRetry={loadActiveDeliveries}
            onDismiss={clearError}
          />
        </View>
      )}

      <View style={styles.content}>
        <SectionHeader
          title="Active"
          badge={activeCount > 0 ? `${activeCount}` : undefined}
        />
      </View>

      {loading && !refreshing && activeDeliveries.length === 0 ? (
        <LoadingView text="Loading deliveries..." />
      ) : (
        <FlatList
          data={activeDeliveries}
          keyExtractor={item => item._id}
          renderItem={renderDelivery}
          ListEmptyComponent={renderEmpty}
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
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
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
  errorPadding: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  deliveryCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  restaurantName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feeRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  feeLabel: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  locationsSection: {
    marginBottom: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  locationIcon: {
    fontSize: 18,
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
  actionRow: {
    marginTop: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  completedIcon: {
    fontSize: 18,
    color: colors.success,
    marginRight: spacing.sm,
  },
  completedText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.success,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: spacing.xl,
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
    fontSize: typography.size.xl,
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
    marginTop: spacing.md,
  },
});
