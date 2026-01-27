/**
 * Nearby Requests Screen - Stitch Style
 * Shows delivery requests near the driver's location
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverOpsStore } from '../../src/stores/driverOps.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { NearbyRequest } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { RequestCard } from '../../src/components/ui/RequestCard';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../src/theme/tokens';

export default function NearbyRequestsScreen() {
  const router = useRouter();
  const { profile, toggleAvailability } = useDriverStore();
  const {
    currentLocation,
    lastSyncedAt,
    nearbyRequests,
    loading,
    locationLoading,
    error,
    refreshLocationAndSync,
    loadNearby,
    loadInbox,
    clearError,
  } = useDriverOpsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

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
      await loadInbox();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const location = await refreshLocationAndSync();
    if (location && canViewNearby) {
      await loadNearby();
      await loadInbox();
    }
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

  const formatLastSync = () => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '--';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}`;
  };

  const renderRequest = ({ item }: { item: NearbyRequest }) => {
    const distanceKm = formatDistance(item.distance);
    const etaMinutes = item.distance
      ? Math.max(5, Math.round((item.distance / 1000) * 6))
      : undefined;

    return (
      <RequestCard
        restaurantName={item.restaurant?.restaurantName || 'Restaurant'}
        pickupAddress={item.pickupAddressText}
        dropoffAddress={item.dropoffAddressText}
        fee={item.deliveryFee}
        distance={distanceKm}
        etaMinutes={etaMinutes}
        onPress={() =>
          router.push({
            pathname: `/driver/request/[id]` as const,
            params: { id: item._id, data: JSON.stringify(item) },
          })
        }
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>
          {currentLocation ? 'No nearby requests' : 'Location required'}
        </Text>
        <Text style={styles.emptyText}>
          {currentLocation
            ? 'No delivery requests available in your area right now.'
            : 'Update your location to discover nearby delivery requests.'}
        </Text>
        {!currentLocation && (
          <PrimaryButton
            title="Update GPS"
            onPress={handleUpdateLocation}
            loading={locationLoading}
            style={styles.emptyButton}
          />
        )}
      </Card>

      {/* Tips Card */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Not seeing requests?</Text>
        <Text style={styles.tipsText}>
          • Ensure your availability is turned ON{'\n'}• Verify your profile is
          approved{'\n'}• Restaurant must be verified{'\n'}• Your GPS must be
          close to pickup location
        </Text>
      </Card>
    </View>
  );

  // Show eligibility gate if not allowed to view nearby
  if (!canViewNearby) {
    let gateIcon = '🚫';
    let gateTitle = 'Cannot View Nearby Requests';
    let gateDescription = '';
    let showGoOnline = false;

    if (!profile) {
      gateIcon = '👤';
      gateDescription = 'Please complete your driver profile first.';
    } else if (!profile.isVerified) {
      gateIcon = '⏳';
      gateTitle = 'Verification Pending';
      gateDescription =
        'Your profile is pending verification. Please wait for approval.';
    } else if (!profile.isAvailable) {
      gateIcon = '🔴';
      gateTitle = 'You are Offline';
      gateDescription = 'Go online to see nearby delivery requests.';
      showGoOnline = true;
    }

    return (
      <AppScreen scroll tabBarPadding>
        <View style={styles.header}>
          <Text style={styles.title}>Nearby Requests</Text>
        </View>

        <Card style={styles.gateCard}>
          <Text style={styles.gateIcon}>{gateIcon}</Text>
          <Text style={styles.gateTitle}>{gateTitle}</Text>
          <Text style={styles.gateDescription}>{gateDescription}</Text>
          {showGoOnline && (
            <PrimaryButton
              title="Go Online"
              onPress={handleGoOnline}
              loading={togglingAvailability}
              style={styles.gateButton}
            />
          )}
        </Card>
      </AppScreen>
    );
  }

  return (
    <AppScreen tabBarPadding noPadding>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Nearby Requests</Text>
          {lastSyncedAt && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncText}>🕐 {formatLastSync()}</Text>
            </View>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorPadding}>
          <ErrorBanner
            message={error}
            onRetry={handleUpdateLocation}
            onDismiss={clearError}
          />
        </View>
      )}

      {/* Location Card */}
      <View style={styles.content}>
        <Card style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>YOUR LOCATION</Text>
            {currentLocation ? (
              <Text style={styles.locationValue}>
                {currentLocation.coordinates[1].toFixed(4)},{' '}
                {currentLocation.coordinates[0].toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.locationMissing}>Not set</Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.updateButton,
              locationLoading && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdateLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.updateButtonText}>📍 Update</Text>
            )}
          </TouchableOpacity>
        </Card>

        <SectionHeader
          title="Nearby"
          badge={
            nearbyRequests.length > 0 ? `${nearbyRequests.length}` : undefined
          }
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text,
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  locationValue: {
    fontSize: typography.size.md,
    color: colors.text,
    fontFamily: 'monospace',
  },
  locationMissing: {
    fontSize: typography.size.md,
    color: colors.muted,
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.button,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
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
  tipsCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  tipsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  gateCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    marginTop: spacing.xl,
  },
  gateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  gateTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  gateDescription: {
    fontSize: typography.size.md,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  gateButton: {
    marginTop: spacing.md,
  },
});
