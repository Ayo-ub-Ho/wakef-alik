import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { ActiveDelivery, DeliveryStatus } from '../../src/types/models';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { AxiosError } from 'axios';

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: '#FFA000',
  PROPOSED: '#1976D2',
  ACCEPTED: '#7B1FA2',
  IN_DELIVERY: '#0097A7',
  DELIVERED: '#388E3C',
  CANCELLED: '#D32F2F',
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
   * Backend returns DeliveryRequest[] directly, so _id IS the request ID
   * But also support nested request object for future compatibility
   */
  const getRequestId = (delivery: ActiveDelivery): string => {
    // If nested request exists, use it
    if (delivery.request?._id) {
      return delivery.request._id;
    }
    // Otherwise the delivery object IS the request (DeliveryRequest)
    // So its _id is the request ID
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionButton = (delivery: ActiveDelivery) => {
    const isProcessing = processingId === delivery._id;
    // Backend returns DeliveryRequest directly, status is on the item itself
    const status = (delivery as any).status || delivery.request?.status;

    if (status === 'ACCEPTED') {
      return (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.startButton,
            isProcessing && styles.buttonDisabled,
          ]}
          onPress={() => handleStartDelivery(delivery)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>🚚 Start Delivery</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (status === 'IN_DELIVERY') {
      return (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deliveredButton,
            isProcessing && styles.buttonDisabled,
          ]}
          onPress={() => handleMarkDelivered(delivery)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>✅ Mark Delivered</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (status === 'DELIVERED') {
      return (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Completed</Text>
        </View>
      );
    }

    return null;
  };

  const renderDelivery = ({ item }: { item: ActiveDelivery }) => {
    // Backend returns DeliveryRequest directly, not nested
    // Handle both cases: item IS the request, or item.request exists
    const request = item.request || item;
    const status: DeliveryStatus =
      (request as any)?.status || item.status || 'ACCEPTED';

    // Get restaurant name from either restaurantId (populated) or nested restaurant
    const restaurantName =
      (request as any)?.restaurantId?.restaurantName ||
      (request as any)?.restaurant?.restaurantName ||
      'Unknown Restaurant';

    // Get addresses - they exist directly on the request
    const pickupAddress = (request as any)?.pickupAddressText || 'N/A';
    const dropoffAddress = (request as any)?.dropoffAddressText || 'N/A';
    const deliveryFee = (request as any)?.deliveryFee || 0;

    // For acceptedAt, try assignedAt (what backend uses) or acceptedAt
    const acceptedAt =
      (item as any)?.assignedAt || item.acceptedAt || new Date().toISOString();

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() =>
          router.push({
            pathname: `/driver/request/[id]` as const,
            params: {
              id: getRequestId(item),
              data: JSON.stringify(item),
            },
          })
        }
      >
        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[status] },
            ]}
          >
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.deliveryDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {pickupAddress}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏠 Dropoff</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {dropoffAddress}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Fee</Text>
            <Text style={styles.feeValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Accepted</Text>
            <Text style={styles.detailValue}>{formatDate(acceptedAt)}</Text>
          </View>
        </View>

        {getActionButton(item)}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="🚚"
      title="No active deliveries"
      description="Accept offers to start delivering"
      actionLabel="Check Inbox"
      onAction={() => router.push('/driver/inbox')}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚚 My Deliveries</Text>
        <Text style={styles.subtitle}>
          {activeDeliveries.length} active delivery
          {activeDeliveries.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadActiveDeliveries}
          onDismiss={clearError}
        />
      )}

      {loading && !refreshing && activeDeliveries.length === 0 ? (
        <LoadingView text="Loading deliveries..." />
      ) : (
        <FlatList
          data={activeDeliveries}
          keyExtractor={item => item._id}
          renderItem={renderDelivery}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deliveryDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  feeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  deliveredButton: {
    backgroundColor: '#388E3C',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completedText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 16,
  },
});
