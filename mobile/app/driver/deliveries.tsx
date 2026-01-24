import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { ActiveDelivery, DeliveryStatus } from '../../src/types/models';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';

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

  useEffect(() => {
    loadActiveDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveDeliveries();
    setRefreshing(false);
  };

  const handleStartDelivery = (delivery: ActiveDelivery) => {
    const requestId = delivery.request?._id || delivery.requestId;
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
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleMarkDelivered = (delivery: ActiveDelivery) => {
    const requestId = delivery.request?._id || delivery.requestId;
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
    const status = delivery.request?.status || delivery.status;

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
    const request = item.request;
    const status = request?.status || item.status;

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() =>
          router.push({
            pathname: `/driver/request/[id]` as const,
            params: {
              id: request?._id || item.requestId,
              data: JSON.stringify(request || item),
            },
          })
        }
      >
        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>
            {request?.restaurant?.restaurantName || 'Unknown Restaurant'}
          </Text>
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
              {request?.pickupAddressText || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏠 Dropoff</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {request?.dropoffAddressText || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Fee</Text>
            <Text style={styles.feeValue}>
              ${request?.deliveryFee?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Accepted</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.acceptedAt)}
            </Text>
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
