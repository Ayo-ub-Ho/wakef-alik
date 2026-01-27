/**
 * Restaurant Profile Screen - Stitch Style
 * Display restaurant information, verification status, and latest request
 */
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRestaurantStore } from '../../src/stores/restaurant.store';
import { useRequestsStore } from '../../src/stores/requests.store';
import { DeliveryStatus } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';

const STATUS_STYLES: Record<
  DeliveryStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING: { bg: colors.warningLight, text: colors.warning, label: 'Pending' },
  PROPOSED: { bg: colors.infoLight, text: colors.info, label: 'Proposed' },
  ACCEPTED: { bg: '#F3E5F5', text: '#7B1FA2', label: 'Accepted' },
  IN_DELIVERY: { bg: '#E0F7FA', text: '#0097A7', label: 'In Delivery' },
  DELIVERED: {
    bg: colors.successLight,
    text: colors.success,
    label: 'Delivered',
  },
  CANCELLED: {
    bg: colors.dangerLight,
    text: colors.danger,
    label: 'Cancelled',
  },
};

export default function RestaurantProfileScreen() {
  const router = useRouter();
  const { logout, loading: authLoading } = useAuthStore();
  const {
    profile,
    loading: profileLoading,
    error,
    fetchProfile,
    clearError,
  } = useRestaurantStore();
  const { requests, fetchMyRequests } = useRequestsStore();

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchMyRequests();
    }, [fetchProfile, fetchMyRequests]),
  );

  // Redirect to edit if no profile
  useEffect(() => {
    if (!profileLoading && profile === null) {
      router.replace('/restaurant/profile-edit' as Href);
    }
  }, [profile, profileLoading, router]);

  const handleEditProfile = () => {
    router.push('/restaurant/profile-edit' as Href);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as Href);
        },
      },
    ]);
  };

  // Get latest non-delivered request
  const latestActiveRequest = requests.find(
    r => !['DELIVERED', 'CANCELLED'].includes(r.status),
  );

  if (profileLoading) {
    return <LoadingView text="Loading profile..." />;
  }

  if (!profile) {
    return null; // Will redirect to edit
  }

  return (
    <AppScreen scroll>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.subtitle}>Restaurant Profile</Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={fetchProfile}
          onDismiss={clearError}
        />
      )}

      {/* Verification Status Card */}
      <Card
        style={[
          styles.verificationCard,
          {
            backgroundColor: profile.isVerified
              ? colors.successLight
              : colors.warningLight,
          },
        ]}
      >
        <View style={styles.verificationHeader}>
          <Text style={styles.verificationIcon}>
            {profile.isVerified ? '✅' : '⏳'}
          </Text>
          <View
            style={[
              styles.verificationBadge,
              {
                backgroundColor: profile.isVerified
                  ? colors.success
                  : colors.warning,
              },
            ]}
          >
            <Text style={styles.verificationBadgeText}>
              {profile.isVerified ? 'VERIFIED' : 'PENDING'}
            </Text>
          </View>
        </View>
        <Text style={styles.verificationTitle}>
          {profile.isVerified
            ? 'Your restaurant is verified'
            : 'Awaiting verification'}
        </Text>
        <Text style={styles.verificationSubtitle}>
          {profile.isVerified
            ? 'You can create delivery requests'
            : 'An admin will review your profile soon'}
        </Text>
      </Card>

      {/* Restaurant Information */}
      <SectionHeader title="Restaurant Details" emoji="🏪" />

      <Card>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{profile.restaurantName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{profile.ownerName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValueSmall}>{profile.addressText}</Text>
        </View>

        {profile.location && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <Text style={styles.coordsText}>
                {profile.location.coordinates[1].toFixed(5)},{' '}
                {profile.location.coordinates[0].toFixed(5)}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Update Button */}
      <PrimaryButton
        title="✏️ Update Profile"
        onPress={handleEditProfile}
        style={styles.updateButton}
      />

      {/* Latest Active Request */}
      <SectionHeader title="Latest Active Request" emoji="📦" />

      {latestActiveRequest ? (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/restaurant/requests/[id]` as const,
              params: {
                id: latestActiveRequest._id,
                data: JSON.stringify(latestActiveRequest),
              },
            })
          }
        >
          <Card>
            <View style={styles.requestHeader}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      STATUS_STYLES[latestActiveRequest.status].bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: STATUS_STYLES[latestActiveRequest.status].text,
                    },
                  ]}
                >
                  {STATUS_STYLES[latestActiveRequest.status].label}
                </Text>
              </View>
              <Text style={styles.feeText}>
                {Math.round(latestActiveRequest.deliveryFee)} MAD
              </Text>
            </View>

            <View style={styles.requestLocations}>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>🏪</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {latestActiveRequest.pickupAddressText}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {latestActiveRequest.dropoffAddressText}
                </Text>
              </View>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Details →</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ) : (
        <EmptyState
          icon="📭"
          title="No active requests"
          description="All deliveries completed or no requests created yet"
        />
      )}

      {/* Logout */}
      <View style={styles.footer}>
        <SecondaryButton
          title="Logout"
          onPress={handleLogout}
          loading={authLoading}
          danger
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
  verificationCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verificationIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  verificationBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verificationBadgeText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  verificationTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.size.md,
    color: colors.muted,
    fontWeight: typography.weight.medium,
  },
  infoValue: {
    fontSize: typography.size.md,
    color: colors.text,
    fontWeight: typography.weight.semibold,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
  infoValueSmall: {
    fontSize: typography.size.sm,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
  coordsText: {
    fontSize: typography.size.sm,
    color: colors.muted,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  updateButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feeText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  requestLocations: {
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.muted,
  },
  viewDetailsRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
});
