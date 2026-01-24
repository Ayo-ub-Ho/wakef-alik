import React, { useEffect, useState } from 'react';
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
import { useDriverOpsStore } from '../../../src/stores/driverOps.store';
import { DeliveryStatus, DeliveryRequest } from '../../../src/types/models';
import { LoadingView } from '../../../src/components/LoadingView';
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
  PENDING: 'Waiting for offers',
  PROPOSED: 'Offers have been submitted',
  ACCEPTED: 'Driver assigned - ready to start',
  IN_DELIVERY: 'Delivery in progress',
  DELIVERED: 'Delivery completed',
  CANCELLED: 'Request cancelled',
};

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const { updateStatus, loadActiveDeliveries } = useDriverOpsStore();

  const [request, setRequest] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Parse data from navigation params
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setRequest(parsed);
      } catch (err) {
        console.error('Failed to parse request data:', err);
      }
    }
    setLoading(false);
  }, [data]);

  const handleStartDelivery = () => {
    Alert.alert('Start Delivery', 'Are you ready to start this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          if (!id) return;
          setProcessing(true);
          try {
            await updateStatus(id, 'IN_DELIVERY');
            // Update local state instead of refetching
            setRequest(prev =>
              prev ? { ...prev, status: 'IN_DELIVERY' } : null,
            );
            await loadActiveDeliveries();
            Alert.alert('Success', 'Delivery started!');
          } catch (err) {
            console.error('Start delivery failed:', err);
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleMarkDelivered = () => {
    Alert.alert('Complete Delivery', 'Has this delivery been completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Completed',
        onPress: async () => {
          if (!id) return;
          setProcessing(true);
          try {
            await updateStatus(id, 'DELIVERED');
            // Update local state instead of refetching
            setRequest(prev =>
              prev ? { ...prev, status: 'DELIVERED' } : null,
            );
            await loadActiveDeliveries();
            Alert.alert('Success', 'Delivery marked as completed!');
          } catch (err) {
            console.error('Mark delivered failed:', err);
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const renderActionButton = () => {
    if (!request) return null;

    if (request.status === 'ACCEPTED') {
      return (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.startButton,
            processing && styles.buttonDisabled,
          ]}
          onPress={handleStartDelivery}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>🚚 Start Delivery</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (request.status === 'IN_DELIVERY') {
      return (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deliveredButton,
            processing && styles.buttonDisabled,
          ]}
          onPress={handleMarkDelivered}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>✅ Mark Delivered</Text>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  if (loading) {
    return <LoadingView text="Loading..." />;
  }

  if (!request) {
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
          title="Request data unavailable"
          description="Please open request details from Nearby, Inbox, or Deliveries screen"
          actionLabel="Go to Deliveries"
          onAction={() => router.replace('/driver/deliveries' as Href)}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.replace('/driver' as Href)}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Request Details</Text>
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: STATUS_COLORS[request.status] + '20' },
          ]}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[request.status] },
            ]}
          >
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {STATUS_DESCRIPTIONS[request.status]}
          </Text>
        </View>

        {/* Fee */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeAmount}>
            ${request.deliveryFee.toFixed(2)}
          </Text>
        </View>

        {/* Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <Text style={styles.addressText}>{request.pickupAddressText}</Text>
          <Text style={styles.coordsText}>
            {request.pickupLocation.coordinates[1].toFixed(6)},{' '}
            {request.pickupLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Dropoff Location</Text>
          <Text style={styles.addressText}>{request.dropoffAddressText}</Text>
          <Text style={styles.coordsText}>
            {request.dropoffLocation.coordinates[1].toFixed(6)},{' '}
            {request.dropoffLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        {/* Notes */}
        {request.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Notes</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Created</Text>
          <Text style={styles.metaText}>
            {new Date(request.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Action Button */}
        {renderActionButton()}
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
    backgroundColor: '#007AFF',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#2e7d32',
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
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
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
    fontSize: 18,
    fontWeight: '600',
  },
});
