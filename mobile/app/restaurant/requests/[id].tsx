/**
 * Request Details Screen - Stitch Style
 * Shows detailed information about a specific delivery request
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { DeliveryStatus, DeliveryRequest } from '../../../src/types/models';
import { AppScreen } from '../../../src/components/ui/AppScreen';
import { Card } from '../../../src/components/ui/Card';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { LoadingView } from '../../../src/components/LoadingView';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { EmptyState } from '../../../src/components/EmptyState';
import { colors, typography, spacing, radius } from '../../../src/theme/tokens';

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

const STATUS_DESCRIPTIONS: Record<DeliveryStatus, string> = {
  PENDING: 'Waiting for drivers to make offers',
  PROPOSED: 'Drivers have submitted offers',
  ACCEPTED: 'A driver has been assigned',
  IN_DELIVERY: 'Driver is delivering your order',
  DELIVERED: 'Delivery completed successfully',
  CANCELLED: 'This request has been cancelled',
};

// Statuses that should auto-refresh
const AUTO_REFRESH_STATUSES: DeliveryStatus[] = ['PENDING', 'PROPOSED'];
const AUTO_REFRESH_INTERVAL = 6000; // 6 seconds

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const {
    current,
    loading,
    error,
    fetchRequestById,
    cancel,
    clearCurrent,
    clearError,
  } = useRequestsStore();

  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if driver is assigned
  const isDriverAssigned = useCallback((req: DeliveryRequest | null) => {
    if (!req) return false;
    return (
      !!req.assignedDriverId ||
      ['ACCEPTED', 'IN_DELIVERY', 'DELIVERED'].includes(req.status)
    );
  }, []);

  // Check if should auto-refresh
  const shouldAutoRefresh = useCallback((req: DeliveryRequest | null) => {
    if (!req) return false;
    return AUTO_REFRESH_STATUSES.includes(req.status);
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!id || refreshing) return;
    setRefreshing(true);
    try {
      await fetchRequestById(id);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If data is passed via params, use it directly
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setRequest(parsed);
      } catch (err) {
        console.error('Failed to parse request data:', err);
      }
    }

    // Also fetch fresh data in background (but don't block UI)
    if (id) {
      fetchRequestById(id);
    }

    return () => {
      clearCurrent();
      // Clear auto-refresh on unmount
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, data]);

  // Sync with store's current when it updates
  useEffect(() => {
    if (current && current._id === id) {
      setRequest(current);
    }
  }, [current, id]);

  // Setup auto-refresh based on status
  useEffect(() => {
    const displayRequest = request || current;

    // Clear existing interval
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }

    // Setup new interval if needed
    if (id && shouldAutoRefresh(displayRequest)) {
      autoRefreshRef.current = setInterval(() => {
        fetchRequestById(id);
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [id, request, current, shouldAutoRefresh, fetchRequestById]);

  const displayRequest = request || current;
  const canCancel =
    displayRequest?.status === 'PENDING' ||
    displayRequest?.status === 'PROPOSED';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this delivery request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setCancelling(true);
            try {
              await cancel(id);
              // Update local state immediately
              setRequest(prev =>
                prev ? { ...prev, status: 'CANCELLED' } : null,
              );
              Alert.alert('Success', 'Request has been cancelled');
            } catch (err) {
              console.error('Cancel failed:', err);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading only if we have neither parsed data nor store data
  if (loading && !displayRequest) {
    return (
      <AppScreen>
        <LoadingView text="Loading request..." />
      </AppScreen>
    );
  }

  if (!displayRequest) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Request Details</Text>
        </View>
        <EmptyState
          icon="📦"
          title="Request not found"
          description="This request may have been deleted or is unavailable"
          actionLabel="Go to Requests"
          onAction={() => router.replace('/restaurant/requests' as Href)}
        />
      </AppScreen>
    );
  }

  const statusStyle = STATUS_STYLES[displayRequest.status];

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
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/restaurant/requests' as Href)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                refreshing && styles.buttonDisabled,
              ]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Request Details</Text>
          {shouldAutoRefresh(displayRequest) && (
            <View style={styles.autoRefreshBadge}>
              <Text style={styles.autoRefreshText}>
                ⏱ Auto-refreshing every 6s
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {error && <ErrorBanner message={error} onDismiss={clearError} />}

          {/* Status Card */}
          <Card
            style={[styles.statusCard, { backgroundColor: statusStyle.bg }]}
          >
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.text },
              ]}
            >
              <Text style={styles.statusBadgeText}>{statusStyle.label}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {STATUS_DESCRIPTIONS[displayRequest.status]}
            </Text>
          </Card>

          {/* Fee Card */}
          <Card style={styles.feeCard}>
            <Text style={styles.feeLabel}>DELIVERY FEE</Text>
            <Text style={styles.feeAmount}>
              {Math.round(displayRequest.deliveryFee)} MAD
            </Text>
          </Card>

          {/* Driver Assigned Card */}
          {isDriverAssigned(displayRequest) && (
            <Card style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverIcon}>🚚</Text>
                <View style={styles.driverBadge}>
                  <Text style={styles.driverBadgeText}>✓ Driver Assigned</Text>
                </View>
              </View>
              <Text style={styles.driverText}>
                A driver has accepted this delivery request and is handling it.
              </Text>
              {displayRequest.assignedDriverId && (
                <Text style={styles.driverIdText}>
                  {typeof displayRequest.assignedDriverId === 'object'
                    ? `Vehicle: ${(displayRequest.assignedDriverId as any).vehicleType || 'Unknown'}`
                    : `ID: ${displayRequest.assignedDriverId}`}
                </Text>
              )}
            </Card>
          )}

          {/* Locations Section */}
          <SectionHeader title="Locations" emoji="📍" />

          <Card style={styles.locationCard}>
            <View style={styles.locationItem}>
              <Text style={styles.locationIcon}>🏪</Text>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationAddress}>
                  {displayRequest.pickupAddressText}
                </Text>
                <Text style={styles.coordsText}>
                  {displayRequest.pickupLocation.coordinates[1].toFixed(5)},{' '}
                  {displayRequest.pickupLocation.coordinates[0].toFixed(5)}
                </Text>
              </View>
            </View>

            <View style={styles.locationDivider} />

            <View style={styles.locationItem}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>DROP-OFF</Text>
                <Text style={styles.locationAddress}>
                  {displayRequest.dropoffAddressText}
                </Text>
                <Text style={styles.coordsText}>
                  {displayRequest.dropoffLocation.coordinates[1].toFixed(5)},{' '}
                  {displayRequest.dropoffLocation.coordinates[0].toFixed(5)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Notes */}
          {displayRequest.notes && (
            <>
              <SectionHeader title="Notes" emoji="📝" />
              <Card>
                <Text style={styles.notesText}>{displayRequest.notes}</Text>
              </Card>
            </>
          )}

          {/* Meta Section */}
          <SectionHeader title="Details" emoji="📅" />
          <Card>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Created</Text>
              <Text style={styles.metaValue}>
                {formatDate(displayRequest.createdAt)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Request ID</Text>
              <Text style={styles.metaIdValue}>{displayRequest._id}</Text>
            </View>
          </Card>

          {/* Cancel Button */}
          {canCancel && (
            <View style={styles.cancelSection}>
              <SecondaryButton
                title={cancelling ? 'Cancelling...' : '✕ Cancel Request'}
                onPress={handleCancel}
                disabled={cancelling}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Text style={styles.cancelHint}>
                You can cancel until a driver is assigned
              </Text>
            </View>
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
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {},
  backButtonText: {
    fontSize: typography.size.md,
    color: colors.muted,
    fontWeight: typography.weight.medium,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  refreshButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  autoRefreshBadge: {
    backgroundColor: colors.infoLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  autoRefreshText: {
    fontSize: typography.size.xs,
    color: colors.info,
    fontWeight: typography.weight.medium,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusDescription: {
    fontSize: typography.size.md,
    color: colors.text,
    textAlign: 'center',
  },
  feeCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  feeLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  feeAmount: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  driverCard: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: spacing.lg,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  driverIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  driverBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  driverBadgeText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  driverText: {
    fontSize: typography.size.md,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  driverIdText: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  locationCard: {
    marginBottom: spacing.lg,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    marginTop: 2,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  locationAddress: {
    fontSize: typography.size.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  coordsText: {
    fontSize: typography.size.xs,
    color: colors.muted,
    fontFamily: 'monospace',
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    marginLeft: 36,
  },
  notesText: {
    fontSize: typography.size.md,
    color: colors.text,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.size.sm,
    color: colors.muted,
    fontWeight: typography.weight.medium,
  },
  metaValue: {
    fontSize: typography.size.sm,
    color: colors.text,
    fontWeight: typography.weight.medium,
  },
  metaIdValue: {
    fontSize: typography.size.xs,
    color: colors.muted,
    fontFamily: 'monospace',
    maxWidth: '60%',
  },
  cancelSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  cancelButton: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  cancelButtonText: {
    color: colors.danger,
  },
  cancelHint: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
