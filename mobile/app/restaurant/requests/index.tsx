import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { DeliveryRequest, DeliveryStatus } from '../../../src/types/models';
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

export default function RequestsListScreen() {
  const router = useRouter();
  const { requests, loading, error, fetchMyRequests, clearError } =
    useRequestsStore();
  const [refreshing, setRefreshing] = useState(false);

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

  const renderRequest = ({ item }: { item: DeliveryRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.requestHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.feeText}>${item.deliveryFee.toFixed(2)}</Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickupAddressText}
          </Text>
        </View>
        <View style={styles.addressArrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>🏠</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.dropoffAddressText}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="📦"
      title="No delivery requests yet"
      description="Create your first request to get started"
      actionLabel="Create Request"
      onAction={handleNewRequest}
    />
  );

  // Show loading only on initial load
  if (loading && requests.length === 0 && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Delivery Requests</Text>
          <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
        <LoadingView text="Loading requests..." />
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
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Requests</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={fetchMyRequests}
          onDismiss={clearError}
        />
      )}

      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#34C759']}
            tintColor="#34C759"
          />
        }
      />
    </View>
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
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
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
  newButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newButtonText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  addressArrow: {
    paddingLeft: 22,
    paddingVertical: 2,
  },
  arrowText: {
    fontSize: 12,
    color: '#999',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});
