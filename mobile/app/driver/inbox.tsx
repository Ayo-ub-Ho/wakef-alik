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
import { RequestOffer, OfferState } from '../../src/types/models';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { AxiosError } from 'axios';

const OFFER_STATE_COLORS: Record<OfferState, string> = {
  SENT: '#1976D2',
  ACCEPTED: '#388E3C',
  REJECTED: '#D32F2F',
  EXPIRED: '#9E9E9E',
};

export default function InboxScreen() {
  const router = useRouter();
  const {
    inbox,
    loading,
    error,
    lastSyncedAt,
    loadInbox,
    acceptOfferAndSync,
    rejectOfferAndSync,
    clearError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [loadInbox]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInbox();
    setRefreshing(false);
  };

  /**
   * Get user-friendly error message from API error
   */
  const getErrorMessage = (err: unknown): string => {
    const axiosError = err as AxiosError<{ message?: string; error?: string }>;

    // Handle specific HTTP status codes
    if (axiosError.response?.status === 409) {
      return 'This offer is no longer available. It may have been accepted by another driver or expired.';
    }
    if (axiosError.response?.status === 404) {
      return 'This offer was not found. It may have been removed.';
    }
    if (axiosError.response?.status === 403) {
      return 'You are not authorized to accept this offer.';
    }

    // Extract message from response
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    return 'Failed to process offer. Please try again.';
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
              const acceptedOffer = await acceptOfferAndSync(offer._id);
              Alert.alert(
                'Success',
                'Offer accepted! Navigating to delivery.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to deliveries, passing request data if available
                      if (acceptedOffer?.request) {
                        router.push({
                          pathname: `/driver/request/[id]` as const,
                          params: {
                            id: acceptedOffer.request._id,
                            data: JSON.stringify(acceptedOffer.request),
                          },
                        });
                      } else {
                        router.push('/driver/deliveries');
                      }
                    },
                  },
                ],
              );
            } catch (err) {
              // 409 = offer no longer available (expected race condition)
              const message = getErrorMessage(err);
              Alert.alert('Cannot Accept Offer', message, [
                {
                  text: 'OK',
                  onPress: () => {
                    // Refresh inbox to get updated offers
                    loadInbox();
                  },
                },
              ]);
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
            await rejectOfferAndSync(offer._id);
          } catch (err) {
            console.error('Reject failed:', err);
            const message = getErrorMessage(err);
            Alert.alert('Cannot Reject Offer', message, [
              {
                text: 'OK',
                onPress: () => loadInbox(),
              },
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

  const renderOffer = ({ item }: { item: RequestOffer }) => {
    const isProcessing = processingId === item._id;
    const request = item.request;

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Text style={styles.restaurantName}>
            {request?.restaurant?.restaurantName || 'Unknown Restaurant'}
          </Text>
          <View style={styles.headerBadges}>
            <View
              style={[
                styles.stateBadge,
                { backgroundColor: OFFER_STATE_COLORS[item.state] },
              ]}
            >
              <Text style={styles.stateBadgeText}>{item.state}</Text>
            </View>
          </View>
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
          <View style={styles.feeRow}>
            <Text style={styles.detailLabel}>💰 Delivery Fee</Text>
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

        <Text style={styles.sentTimeText}>Sent: {formatDate(item.sentAt)}</Text>

        {item.state === 'SENT' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.rejectButton,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={() => handleReject(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#D32F2F" />
              ) : (
                <Text style={styles.rejectButtonText}>✕ Reject</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={() => handleAccept(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.acceptButtonText}>✓ Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="📥"
      title="No offers in your inbox"
      description="Offers from restaurants will appear here. Make sure your availability is turned on and GPS is updated."
    />
  );

  const formatLastSync = () => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return `Last synced: ${date.toLocaleTimeString()}`;
  };

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
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>
            {inbox.length} pending offer{inbox.length !== 1 ? 's' : ''}
          </Text>
          {lastSyncedAt && (
            <Text style={styles.syncTime}>{formatLastSync()}</Text>
          )}
        </View>
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
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  syncTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  sentTimeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
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
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
