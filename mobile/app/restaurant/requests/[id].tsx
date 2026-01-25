import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { DeliveryStatus, DeliveryRequest } from '../../../src/types/models';
import { LoadingView } from '../../../src/components/LoadingView';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { EmptyState } from '../../../src/components/EmptyState';

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: '#FFA000',
  PROPOSED: '#1976D2',
  ACCEPTED: '#7B1FA2',
  IN_DELIVERY: '#0097A7',
  DELIVERED: '#388E3C',
  CANCELLED: '#D32F2F',
};

const STATUS_DESCRIPTIONS: Record<DeliveryStatus, string> = {
  PENDING: 'Waiting for drivers to make offers',
  PROPOSED: 'Drivers have submitted offers',
  ACCEPTED: 'A driver has been assigned',
  IN_DELIVERY: 'Driver is delivering your order',
  DELIVERED: 'Delivery completed',
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

  // Show loading only if we have neither parsed data nor store data
  if (loading && !displayRequest) {
    return <LoadingView text="Loading request..." />;
  }

  if (!displayRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.headerBackText}>← Back</Text>
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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.replace('/restaurant/requests' as Href)}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Request Details</Text>
          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            )}
          </TouchableOpacity>
        </View>
        {shouldAutoRefresh(displayRequest) && (
          <Text style={styles.autoRefreshHint}>
            Auto-refreshing every 6s...
          </Text>
        )}
      </View>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <View style={styles.content}>
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: STATUS_COLORS[displayRequest.status] + '20' },
          ]}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[displayRequest.status] },
            ]}
          >
            <Text style={styles.statusText}>{displayRequest.status}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {STATUS_DESCRIPTIONS[displayRequest.status]}
          </Text>
        </View>

        {/* Fee */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeAmount}>
            ${displayRequest.deliveryFee.toFixed(2)}
          </Text>
        </View>

        {/* Driver Assigned Card */}
        {isDriverAssigned(displayRequest) && (
          <View style={styles.driverCard}>
            <Text style={styles.driverCardTitle}>🚚 Driver Assigned ✅</Text>
            <Text style={styles.driverCardText}>
              A driver has accepted this delivery request.
            </Text>
            {displayRequest.assignedDriverId && (
              <>
                {typeof displayRequest.assignedDriverId === 'object' ? (
                  <Text style={styles.driverCardText}>
                    Vehicle:{' '}
                    {(displayRequest.assignedDriverId as any).vehicleType ||
                      'Unknown'}
                  </Text>
                ) : (
                  <Text style={styles.driverIdText}>
                    Driver ID: {displayRequest.assignedDriverId}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <Text style={styles.addressText}>
            {displayRequest.pickupAddressText}
          </Text>
          <Text style={styles.coordsText}>
            {displayRequest.pickupLocation.coordinates[1].toFixed(6)},{' '}
            {displayRequest.pickupLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Dropoff Location</Text>
          <Text style={styles.addressText}>
            {displayRequest.dropoffAddressText}
          </Text>
          <Text style={styles.coordsText}>
            {displayRequest.dropoffLocation.coordinates[1].toFixed(6)},{' '}
            {displayRequest.dropoffLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        {/* Notes */}
        {displayRequest.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Notes</Text>
            <Text style={styles.notesText}>{displayRequest.notes}</Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Created</Text>
          <Text style={styles.metaText}>
            {new Date(displayRequest.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerBackButton: {
    marginBottom: 12,
  },
  headerBackText: {
    color: '#fff',
    fontSize: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  autoRefreshHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  feeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
  },
  driverCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  driverCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  driverCardText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 4,
  },
  driverIdText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
  },
  metaText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
