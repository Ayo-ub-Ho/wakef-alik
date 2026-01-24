import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { NearbyRequest, DeliveryStatus } from '../../src/types/models';
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

export default function NearbyRequestsScreen() {
  const router = useRouter();
  const { profile } = useDriverStore();
  const {
    currentLocation,
    nearbyRequests,
    loading,
    locationLoading,
    error,
    refreshLocationAndSync,
    loadNearby,
    clearError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);

  // Check eligibility
  const canViewNearby = profile && profile.isVerified && profile.isAvailable;

  // Load nearby requests when location is available
  useEffect(() => {
    if (currentLocation && canViewNearby) {
      loadNearby();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, canViewNearby]);

  const handleUpdateLocation = async () => {
    clearError();
    const location = await refreshLocationAndSync();
    if (location && canViewNearby) {
      await loadNearby();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const location = await refreshLocationAndSync();
    if (location && canViewNearby) {
      await loadNearby();
    }
    setRefreshing(false);
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return 'N/A';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const renderRequest = ({ item }: { item: NearbyRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() =>
        router.push({
          pathname: `/driver/request/[id]` as const,
          params: { id: item._id, data: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.requestHeader}>
        <Text style={styles.restaurantName}>
          {item.restaurant?.restaurantName || 'Unknown Restaurant'}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Distance</Text>
          <Text style={styles.detailValue}>
            {formatDistance(item.distance)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Fee</Text>
          <Text style={styles.feeValue}>${item.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📦 Pickup</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {item.pickupAddressText}
          </Text>
        </View>
      </View>

      <View style={styles.viewDetailsRow}>
        <Text style={styles.viewDetailsText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="📍"
      title={currentLocation ? 'No nearby requests' : 'Location required'}
      description={
        currentLocation
          ? 'No delivery requests available in your area right now. Pull to refresh.'
          : 'Update your location to discover nearby delivery requests.'
      }
      actionLabel={currentLocation ? undefined : 'Update Location'}
      onAction={currentLocation ? undefined : handleUpdateLocation}
    />
  );

  // Show eligibility gate if not allowed to view nearby
  if (!canViewNearby) {
    let gateTitle = 'Cannot View Nearby Requests';
    let gateDescription = '';

    if (!profile) {
      gateDescription = 'Please complete your driver profile first.';
    } else if (!profile.isVerified) {
      gateDescription =
        'Your profile is pending verification. Please wait for approval.';
    } else if (!profile.isAvailable) {
      gateDescription =
        'Turn on availability on the home screen to see nearby requests.';
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📍 Nearby Requests</Text>
        </View>
        <EmptyState
          icon="🚫"
          title={gateTitle}
          description={gateDescription}
          actionLabel="Go to Home"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📍 Nearby Requests</Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleUpdateLocation}
          onDismiss={clearError}
        />
      )}

      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Your Location</Text>
          {currentLocation ? (
            <Text style={styles.locationValue}>
              {currentLocation.coordinates[1].toFixed(5)},{' '}
              {currentLocation.coordinates[0].toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.locationMissing}>Not set</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.updateLocationButton,
            locationLoading && styles.buttonDisabled,
          ]}
          onPress={handleUpdateLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateLocationText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing && nearbyRequests.length === 0 ? (
        <LoadingView text="Loading nearby requests..." />
      ) : (
        <FlatList
          data={nearbyRequests}
          keyExtractor={item => item._id}
          renderItem={renderRequest}
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
  locationCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  locationMissing: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  updateLocationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  updateLocationText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  requestCard: {
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
  requestHeader: {
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
  requestDetails: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  viewDetailsRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
