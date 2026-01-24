import React, { useEffect } from 'react';
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
import { DeliveryStatus } from '../../../src/types/models';

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

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { current, loading, error, fetchRequestById, cancel, clearCurrent } =
    useRequestsStore();

  useEffect(() => {
    if (id) {
      fetchRequestById(id);
    }

    return () => {
      clearCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canCancel =
    current?.status === 'PENDING' || current?.status === 'PROPOSED';

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
            try {
              if (id) {
                await cancel(id);
                Alert.alert('Success', 'Request has been cancelled');
              }
            } catch (err) {
              console.error('Cancel failed:', err);
            }
          },
        },
      ],
    );
  };

  if (loading && !current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Request not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Request Details</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: STATUS_COLORS[current.status] + '20' },
          ]}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[current.status] },
            ]}
          >
            <Text style={styles.statusText}>{current.status}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {STATUS_DESCRIPTIONS[current.status]}
          </Text>
        </View>

        {/* Fee */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeAmount}>
            ${current.deliveryFee.toFixed(2)}
          </Text>
        </View>

        {/* Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <Text style={styles.addressText}>{current.pickupAddressText}</Text>
          <Text style={styles.coordsText}>
            {current.pickupLocation.coordinates[1].toFixed(6)},{' '}
            {current.pickupLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Dropoff Location</Text>
          <Text style={styles.addressText}>{current.dropoffAddressText}</Text>
          <Text style={styles.coordsText}>
            {current.dropoffLocation.coordinates[1].toFixed(6)},{' '}
            {current.dropoffLocation.coordinates[0].toFixed(6)}
          </Text>
        </View>

        {/* Notes */}
        {current.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Notes</Text>
            <Text style={styles.notesText}>{current.notes}</Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Created</Text>
          <Text style={styles.metaText}>
            {new Date(current.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, loading && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={loading}
          >
            {loading ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    color: '#c62828',
    textAlign: 'center',
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
