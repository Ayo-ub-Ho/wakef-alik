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
import { RequestOffer } from '../../src/types/models';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';

export default function InboxScreen() {
  const router = useRouter();
  const { inbox, loading, error, loadInbox, accept, reject, clearError } =
    useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInbox();
    setRefreshing(false);
  };

  const handleAccept = (offer: RequestOffer) => {
    Alert.alert(
      'Accept Offer',
      'Are you sure you want to accept this delivery offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessingId(offer._id);
            try {
              await accept(offer._id);
              Alert.alert('Success', 'Offer accepted! Check your deliveries.');
            } catch (err) {
              console.error('Accept failed:', err);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = (offer: RequestOffer) => {
    Alert.alert('Reject Offer', 'Are you sure you want to reject this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessingId(offer._id);
          try {
            await reject(offer._id);
          } catch (err) {
            console.error('Reject failed:', err);
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

  const renderOffer = ({ item }: { item: RequestOffer }) => {
    const isProcessing = processingId === item._id;
    const request = item.request;

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Text style={styles.restaurantName}>
            {request?.restaurant?.restaurantName || 'Unknown Restaurant'}
          </Text>
          <Text style={styles.sentTime}>{formatDate(item.sentAt)}</Text>
        </View>

        <View style={styles.offerDetails}>
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
          {item.message && (
            <View style={styles.messageRow}>
              <Text style={styles.messageLabel}>Message:</Text>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing && processingId === item._id ? (
              <ActivityIndicator size="small" color="#D32F2F" />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing && processingId === item._id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="📥"
      title="No offers in your inbox"
      description="Offers from restaurants will appear here. Make sure your availability is turned on."
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
        <Text style={styles.title}>📥 Offers Inbox</Text>
        <Text style={styles.subtitle}>
          {inbox.length} pending offer{inbox.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadInbox}
          onDismiss={clearError}
        />
      )}

      {loading && !refreshing && inbox.length === 0 ? (
        <LoadingView text="Loading inbox..." />
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={item => item._id}
          renderItem={renderOffer}
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
  offerCard: {
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
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sentTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  offerDetails: {
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
  messageRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D32F2F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
