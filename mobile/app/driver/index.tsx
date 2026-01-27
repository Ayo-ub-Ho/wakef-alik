/**
 * Driver Dashboard - Stitch-style Orders Tab
 * Features:
 * - AppTopBar with avatar, greeting, online toggle
 * - Location card with GPS coordinates
 * - Nearby Requests section with RequestCards
 * - Quick action buttons
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';

// UI Components
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { RequestCard } from '../../src/components/ui/RequestCard';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';

// Theme
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
} from '../../src/theme/tokens';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    profile,
    loading: profileLoading,
    availabilityLoading,
    error: profileError,
    fetchProfile,
    toggleAvailability,
    clearError: clearProfileError,
  } = useDriverStore();
  const {
    inbox,
    activeDeliveries,
    currentLocation,
    lastSyncedAt,
    error: opsError,
    loadInbox,
    loadActiveDeliveries,
    refreshLocationAndSync,
    acceptOfferAndSync,
    rejectOfferAndSync,
    removeOfferFromInbox,
    clearError: clearOpsError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(
    null,
  );
  const [locationLoading, setLocationLoading] = useState(false);

  // Track if we've already checked profile to avoid loops
  const hasCheckedProfile = useRef(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to profile screen if no profile exists
  useEffect(() => {
    if (profileLoading) return;
    if (hasCheckedProfile.current) return;
    hasCheckedProfile.current = true;

    if (profile === null) {
      router.replace('/driver/profile' as Href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading]);

  // Load inbox and deliveries when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (profile?.isVerified && profile?.isAvailable) {
        loadInbox();
        loadActiveDeliveries();
      }
    }, [profile, loadInbox, loadActiveDeliveries]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      refreshLocationAndSync(),
      loadInbox(),
      loadActiveDeliveries(),
    ]);
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value: boolean) => {
    try {
      await toggleAvailability(value);
      if (value) {
        // When going online, sync location and load offers
        await refreshLocationAndSync();
        await loadInbox();
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setProcessingOfferId(offerId);
    try {
      const acceptedOffer = await acceptOfferAndSync(offerId);
      Alert.alert('Success', 'Offer accepted!', [
        {
          text: 'View Delivery',
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
              router.push('/driver/deliveries' as Href);
            }
          },
        },
      ]);
    } catch {
      // Remove stale offer from UI immediately
      removeOfferFromInbox(offerId);
      Alert.alert('Error', 'This offer is no longer available.');
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    Alert.alert('Reject Offer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessingOfferId(offerId);
          try {
            await rejectOfferAndSync(offerId);
          } catch {
            Alert.alert('Error', 'Failed to reject offer.');
          } finally {
            setProcessingOfferId(null);
          }
        },
      },
    ]);
  };

  // Show loading while checking profile
  if (profileLoading) {
    return <LoadingView text="Loading profile..." />;
  }

  const userName = user?.fullName?.split(' ')[0] || 'Driver';
  const userInitial = userName.charAt(0).toUpperCase();
  const isOnline = profile?.isAvailable ?? false;
  const isVerified = profile?.isVerified ?? false;
  const hasActiveDeliveries = activeDeliveries.length > 0;

  const handleUpdateLocation = async () => {
    setLocationLoading(true);
    try {
      await refreshLocationAndSync();
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <AppScreen edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Stitch-style Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            {/* Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Salam, {userName}!</Text>
              <Text style={styles.greetingSubtitle}>
                {isVerified ? 'Ready to deliver?' : 'Verification pending'}
              </Text>
            </View>
          </View>
          {/* Online Toggle */}
          <View style={styles.onlineToggleContainer}>
            {availabilityLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity
                style={[
                  styles.onlineToggle,
                  isOnline && styles.onlineToggleActive,
                ]}
                onPress={() => handleToggleAvailability(!isOnline)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.onlineToggleKnob,
                    isOnline && styles.onlineToggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            )}
            <Text
              style={[styles.onlineLabel, isOnline && styles.onlineLabelActive]}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Errors */}
        {profileError && (
          <View style={styles.errorContainer}>
            <ErrorBanner message={profileError} onDismiss={clearProfileError} />
          </View>
        )}
        {opsError && (
          <View style={styles.errorContainer}>
            <ErrorBanner message={opsError} onDismiss={clearOpsError} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Location Card - Stitch Style */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIconContainer}>
                <Text style={styles.locationIcon}>📍</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Your Location</Text>
                {currentLocation ? (
                  <Text style={styles.locationCoords}>
                    {currentLocation.coordinates[1].toFixed(5)},{' '}
                    {currentLocation.coordinates[0].toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.locationMissing}>
                    Location not available
                  </Text>
                )}
                {lastSyncedAt && (
                  <Text style={styles.locationSyncTime}>
                    Updated {new Date(lastSyncedAt).toLocaleTimeString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.locationUpdateButton}
                onPress={handleUpdateLocation}
                disabled={locationLoading}
                activeOpacity={0.8}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.locationUpdateText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Cards */}
          {!isVerified && (
            <Card style={styles.warningCard}>
              <Text style={styles.warningIcon}>⏳</Text>
              <Text style={styles.warningTitle}>Verification Pending</Text>
              <Text style={styles.warningText}>
                Your profile is being reviewed. You will be able to accept
                deliveries once verified.
              </Text>
            </Card>
          )}

          {/* Active Deliveries */}
          {hasActiveDeliveries && (
            <>
              <SectionHeader
                title="Active Deliveries"
                badge={`${activeDeliveries.length}`}
                actionText="View All"
                onAction={() => router.push('/driver/deliveries' as Href)}
              />
              <Card style={styles.activeDeliveryCard} noPadding>
                <TouchableOpacity
                  style={styles.activeDeliveryContent}
                  onPress={() => router.push('/driver/deliveries' as Href)}
                >
                  <View style={styles.activeDeliveryIcon}>
                    <Text style={styles.activeDeliveryEmoji}>🚚</Text>
                  </View>
                  <View style={styles.activeDeliveryInfo}>
                    <Text style={styles.activeDeliveryTitle}>
                      {activeDeliveries.length} Active{' '}
                      {activeDeliveries.length === 1
                        ? 'Delivery'
                        : 'Deliveries'}
                    </Text>
                    <Text style={styles.activeDeliveryHint}>
                      Tap to view and update status
                    </Text>
                  </View>
                  <Text style={styles.activeDeliveryArrow}>→</Text>
                </TouchableOpacity>
              </Card>
            </>
          )}

          {/* Nearby Offers / Inbox */}
          {isOnline && isVerified && (
            <>
              <SectionHeader
                title="Nearby Requests"
                badge={inbox.length > 0 ? `${inbox.length} New` : undefined}
                actionText="All Offers"
                onAction={() => router.push('/driver/inbox' as Href)}
              />

              {inbox.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Text style={styles.emptyIcon}>📭</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No offers yet</Text>
                    <Text style={styles.emptyText}>
                      Stay online and nearby requests will appear here
                    </Text>
                    <SecondaryButton
                      title="Update GPS"
                      icon="📍"
                      onPress={handleUpdateLocation}
                      style={styles.emptyButton}
                      small
                    />
                  </View>
                </Card>
              ) : (
                inbox.slice(0, 3).map(offer => {
                  // Compute distance and ETA from deliveryFee (rough estimate)
                  const fee = offer.request?.deliveryFee || 0;
                  // Estimate distance: ~1km per 10 MAD fee
                  const estimatedKm = (fee / 14).toFixed(1);
                  // Estimate ETA: ~6 mins per km
                  const estimatedMins = Math.max(
                    5,
                    Math.round(parseFloat(estimatedKm) * 6),
                  );

                  return (
                    <RequestCard
                      key={offer._id}
                      restaurantName={
                        offer.request?.restaurant?.restaurantName ||
                        'Restaurant'
                      }
                      pickupAddress={
                        offer.request?.pickupAddressText || 'Pickup location'
                      }
                      dropoffAddress={
                        offer.request?.dropoffAddressText || 'Dropoff location'
                      }
                      fee={fee}
                      distance={estimatedKm}
                      etaMinutes={estimatedMins}
                      onAccept={() => handleAcceptOffer(offer._id)}
                      onReject={() => handleRejectOffer(offer._id)}
                      loading={processingOfferId === offer._id}
                      disabled={processingOfferId !== null}
                    />
                  );
                })
              )}
            </>
          )}

          {/* Offline State */}
          {!isOnline && isVerified && (
            <Card style={styles.offlineCard}>
              <Text style={styles.offlineIcon}>😴</Text>
              <Text style={styles.offlineTitle}>You are Offline</Text>
              <Text style={styles.offlineText}>
                Turn on availability to start receiving delivery requests
              </Text>
              <PrimaryButton
                title="Go Online"
                onPress={() => handleToggleAvailability(true)}
                loading={availabilityLoading}
                style={styles.goOnlineButton}
              />
            </Card>
          )}

          {/* Quick Actions - Stitch Style */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/driver/inbox' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBg}>
                <Text style={styles.quickActionIcon}>📥</Text>
              </View>
              <Text style={styles.quickActionText}>Inbox</Text>
              {inbox.length > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>
                    {inbox.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/driver/deliveries' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBg}>
                <Text style={styles.quickActionIcon}>🚚</Text>
              </View>
              <Text style={styles.quickActionText}>Deliveries</Text>
              {hasActiveDeliveries && (
                <View
                  style={[
                    styles.quickActionBadge,
                    styles.quickActionBadgeGreen,
                  ]}
                >
                  <Text style={styles.quickActionBadgeText}>
                    {activeDeliveries.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/driver/nearby' as Href)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBg}>
                <Text style={styles.quickActionIcon}>📍</Text>
              </View>
              <Text style={styles.quickActionText}>Nearby</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacer for Tab Bar */}
          <View style={styles.tabBarSpacer} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Stitch Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: layout.avatarSize,
    height: layout.avatarSize,
    borderRadius: layout.avatarSize / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadows.subtle,
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  greetingSubtitle: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: 2,
  },
  onlineToggleContainer: {
    alignItems: 'center',
  },
  onlineToggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  onlineToggleActive: {
    backgroundColor: colors.success,
  },
  onlineToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...shadows.subtle,
  },
  onlineToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  onlineLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  onlineLabelActive: {
    color: colors.success,
  },

  // Location Card - Stitch Style
  locationCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    fontFamily: 'monospace',
  },
  locationMissing: {
    fontSize: typography.size.md,
    color: colors.muted,
    fontStyle: 'italic',
  },
  locationSyncTime: {
    fontSize: typography.size.xs,
    color: colors.muted,
    marginTop: 2,
  },
  locationUpdateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: 'center',
    ...shadows.button,
  },
  locationUpdateText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },

  // Warning Card
  warningCard: {
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderColor: colors.warning,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.statusPending,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Active Delivery Card
  activeDeliveryCard: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  activeDeliveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  activeDeliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activeDeliveryEmoji: {
    fontSize: 24,
  },
  activeDeliveryInfo: {
    flex: 1,
  },
  activeDeliveryTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.success,
  },
  activeDeliveryHint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeDeliveryArrow: {
    fontSize: 24,
    color: colors.success,
  },

  // Empty State - Stitch Style
  emptyCard: {
    borderRadius: radius.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 250,
    lineHeight: typography.size.md * 1.5,
  },
  emptyButton: {
    minWidth: 160,
  },

  // Offline Card - Stitch Style
  offlineCard: {
    alignItems: 'center',
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxxl,
  },
  offlineIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  offlineTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  offlineText: {
    fontSize: typography.size.md,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
    lineHeight: typography.size.md * 1.5,
  },
  goOnlineButton: {
    minWidth: 200,
  },

  // Quick Actions - Stitch Style
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
    ...shadows.card,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  quickActionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  quickActionBadgeGreen: {
    backgroundColor: colors.success,
  },
  quickActionBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },

  // Tab Bar Spacer
  tabBarSpacer: {
    height: 100,
  },
});
