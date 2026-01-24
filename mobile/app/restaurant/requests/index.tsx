import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { DeliveryRequest, DeliveryStatus } from '../../../src/types/models';

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
  const { requests, loading, error, fetchMyRequests } = useRequestsStore();

  useEffect(() => {
    fetchMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewRequest = () => {
    router.push('/restaurant/requests/new' as Href);
  };

  const handleRequestPress = (id: string) => {
    router.push(`/restaurant/requests/${id}` as Href);
  };

  const renderRequest = ({ item }: { item: DeliveryRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => handleRequestPress(item._id)}
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
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No delivery requests yet</Text>
      <Text style={styles.emptySubtext}>
        Create your first request to get started
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Requests</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMyRequests} />
        }
      />

      {loading && requests.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
        </View>
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
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
