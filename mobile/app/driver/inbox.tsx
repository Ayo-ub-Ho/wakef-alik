/**
 * Inbox Screen - Stitch Style
 * Shows pending delivery offers for the driver
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { RequestOffer, OfferState } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { RequestCard } from '../../src/components/ui/RequestCard';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';
import { AxiosError } from 'axios';

const OFFER_STATE_STYLES: Record<
  OfferState,
  { bg: string; text: string; label: string }
> = {
  SENT: { bg: colors.infoLight, text: colors.info, label: 'Pending' },
  ACCEPTED: {
    bg: colors.successLight,
    text: colors.success,
    label: 'Accepted',
  },
  REJECTED: { bg: colors.dangerLight, text: colors.danger, label: 'Rejected' },
  EXPIRED: { bg: colors.bgDark, text: colors.muted, label: 'Expired' },
};

export default function InboxScreen() {
  const router = useRouter();
  const { profile, toggleAvailability } = useDriverStore();
  const {
    inbox,
    loading,
    error,
    lastSyncedAt,
    loadInbox,
    acceptOfferAndSync,
    rejectOfferAndSync,
    removeOfferFromInbox,
    refreshLocationAndSync,
    clearError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

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

  const handleGoOnline = async () => {
    if (!profile) return;
    setTogglingAvailability(true);
    try {
      await toggleAvailability(true);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleUpdateGPS = async () => {
    await refreshLocationAndSync();
    await loadInbox();
  };

  /**
   * Get user-friendly error message from API error
   */
  const getErrorMessage = (err: unknown): string => {
    const axiosError = err as AxiosError<{ message?: string; error?: string }>;

    if (axiosError.response?.status === 409) {
      return 'This offer is no longer available. It may have been accepted by another driver or expired.';
    }
    if (axiosError.response?.status === 404) {
      return 'This offer was not found. It may have been removed.';
    }
    if (axiosError.response?.status === 403) {
      return 'You are not authorized to accept this offer.';
    }

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
              removeOfferFromInbox(offer._id);
              const message = getErrorMessage(err);
              Alert.alert('Cannot Accept Offer', message);
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
            removeOfferFromInbox(offer._id);
            const message = getErrorMessage(err);
            Alert.alert('Cannot Reject Offer', message);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const formatLastSync = () => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderOffer = ({ item }: { item: RequestOffer }) => {
    const request = item.request;
    const fee = request?.deliveryFee || 0;
    // Estimate distance and ETA
    const estimatedKm = (fee / 14).toFixed(1);
    const estimatedMins = Math.max(5, Math.round(parseFloat(estimatedKm) * 6));

    const stateStyle = OFFER_STATE_STYLES[item.state];

    return (
      <View style={styles.offerWrapper}>
        {/* State Badge */}
        <View style={[styles.stateBadge, { backgroundColor: stateStyle.bg }]}>
          <Text style={[styles.stateBadgeText, { color: stateStyle.text }]}>
            {stateStyle.label}
          </Text>
        </View>

        <RequestCard
          restaurantName={request?.restaurant?.restaurantName || 'Restaurant'}
          pickupAddress={request?.pickupAddressText || 'Pickup location'}
          dropoffAddress={request?.dropoffAddressText || 'Dropoff location'}
          fee={fee}
          distance={estimatedKm}
          etaMinutes={estimatedMins}
          onAccept={
            item.state === 'SENT' ? () => handleAccept(item) : undefined
          }
          onReject={
            item.state === 'SENT' ? () => handleReject(item) : undefined
          }
          loading={processingId === item._id}
          disabled={processingId !== null}
        />
      </View>
    );
  };

  const renderEmpty = () => {
    const isOnline = profile?.isAvailable;

    return (
      <View style={styles.emptyContainer}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No offers in your inbox</Text>
          <Text style={styles.emptyText}>
            {isOnline
              ? 'Offers from restaurants will appear here. Make sure your GPS is updated.'
              : 'Go online to start receiving delivery offers.'}
          </Text>
          {isOnline ? (
            <PrimaryButton
              title="Update GPS"
              onPress={handleUpdateGPS}
              style={styles.emptyButton}
            />
          ) : (
            <PrimaryButton
              title="Go Online"
              onPress={handleGoOnline}
              loading={togglingAvailability}
              style={styles.emptyButton}
            />
          )}
        </Card>
      </View>
    );
  };

  // Count pending offers
  const pendingCount = inbox.filter(o => o.state === 'SENT').length;

  return (
    <AppScreen tabBarPadding noPadding>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Inbox</Text>
          {lastSyncedAt && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncText}>🕐 {formatLastSync()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          {pendingCount > 0
            ? `${pendingCount} pending offer${pendingCount !== 1 ? 's' : ''}`
            : 'No pending offers'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorPadding}>
          <ErrorBanner
            message={error}
            onRetry={loadInbox}
            onDismiss={clearError}
          />
        </View>
      )}

      <View style={styles.content}>
        <SectionHeader
          title="Offers"
          badge={pendingCount > 0 ? `${pendingCount} New` : undefined}
        />
      </View>

      {loading && !refreshing && inbox.length === 0 ? (
        <LoadingView text="Loading inbox..." />
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={item => item._id}
          renderItem={renderOffer}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  syncBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  syncText: {
    fontSize: typography.size.sm,
    color: colors.muted,
    fontWeight: typography.weight.medium,
  },
  errorPadding: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  offerWrapper: {
    marginBottom: spacing.md,
  },
  stateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  stateBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});
