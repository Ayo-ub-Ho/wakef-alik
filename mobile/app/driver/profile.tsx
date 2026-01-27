/**
 * Driver Profile Screen - Stitch Style
 * Shows driver profile with settings and logout
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { VehicleType } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';

const VEHICLE_ICONS: Record<VehicleType, string> = {
  BIKE: '🚲',
  MOTORCYCLE: '🏍️',
  CAR: '🚗',
  VAN: '🚐',
};

const VEHICLE_TYPES: VehicleType[] = ['BIKE', 'MOTORCYCLE', 'CAR', 'VAN'];

export default function DriverProfileScreen() {
  const router = useRouter();
  const { logout, loading: authLoading } = useAuthStore();
  const {
    profile,
    loading,
    error,
    saveProfile,
    fetchProfile,
    toggleAvailability,
    clearError,
  } = useDriverStore();

  const [vehicleType, setVehicleType] = useState<VehicleType>('BIKE');
  const [hasDeliveryBox, setHasDeliveryBox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  // Load existing profile data if available
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setVehicleType(profile.vehicleType);
      setHasDeliveryBox(profile.hasDeliveryBox ?? false);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      clearError();
      await saveProfile({
        vehicleType,
        hasDeliveryBox,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Save profile failed:', err);
    }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      await toggleAvailability(!profile?.isAvailable);
    } finally {
      setTogglingAvailability(false);
    }
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

  return (
    <AppScreen scroll tabBarPadding>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your driver settings</Text>
      </View>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* Availability Card */}
      <Card style={styles.availabilityCard} elevated>
        <View style={styles.availabilityContent}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>AVAILABILITY</Text>
            <Text style={styles.availabilityStatus}>
              {profile?.isAvailable ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.availabilityHint}>
              {profile?.isAvailable
                ? 'You are receiving delivery offers'
                : 'Go online to receive offers'}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            {togglingAvailability ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={profile?.isAvailable ?? false}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: colors.bgDark, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.bgDark}
              />
            )}
          </View>
        </View>
      </Card>

      <SectionHeader
        title="Driver Info"
        actionText={isEditing ? 'Cancel' : 'Edit'}
        onAction={() => setIsEditing(!isEditing)}
      />

      {/* Profile Info Card */}
      <Card>
        {/* Vehicle Type */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Text style={styles.infoLabelText}>Vehicle Type</Text>
          </View>
          {isEditing ? (
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleButton,
                    vehicleType === type && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setVehicleType(type)}
                  disabled={loading}
                >
                  <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[type]}</Text>
                  <Text
                    style={[
                      styles.vehicleButtonText,
                      vehicleType === type && styles.vehicleButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.infoValue}>
              <Text style={styles.vehicleDisplay}>
                {VEHICLE_ICONS[profile?.vehicleType || 'BIKE']}{' '}
                {profile?.vehicleType || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Box */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Text style={styles.infoLabelText}>Delivery Box</Text>
            <Text style={styles.infoHint}>
              Do you have a food delivery box?
            </Text>
          </View>
          {isEditing ? (
            <Switch
              value={hasDeliveryBox}
              onValueChange={setHasDeliveryBox}
              trackColor={{ false: colors.bgDark, true: colors.primary }}
              thumbColor={colors.white}
              disabled={loading}
            />
          ) : (
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: profile?.hasDeliveryBox
                      ? colors.successLight
                      : colors.bgDark,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: profile?.hasDeliveryBox
                        ? colors.success
                        : colors.muted,
                    },
                  ]}
                >
                  {profile?.hasDeliveryBox ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Verification Status */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Text style={styles.infoLabelText}>Verification</Text>
          </View>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: profile?.isVerified
                    ? colors.successLight
                    : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: profile?.isVerified
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {profile?.isVerified ? '✓ Verified' : '⏳ Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <View style={styles.saveRow}>
            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            />
          </View>
        )}
      </Card>

      <SectionHeader title="Account" />

      {/* Account Actions */}
      <Card>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>Terms of Service</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <SecondaryButton
          title="Logout"
          onPress={handleLogout}
          loading={authLoading}
          danger
          style={styles.logoutButton}
        />
      </View>

      {/* Version */}
      <Text style={styles.versionText}>Wakef Alik Driver v1.0.0</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
  availabilityCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  availabilityStatus: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  availabilityHint: {
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  toggleContainer: {
    marginLeft: spacing.lg,
  },
  infoRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    marginBottom: spacing.sm,
  },
  infoLabelText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  infoHint: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: 2,
  },
  infoValue: {
    marginTop: spacing.sm,
  },
  vehicleDisplay: {
    fontSize: typography.size.lg,
    color: colors.text,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  vehicleButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgDark,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  vehicleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  vehicleIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  vehicleButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
  },
  vehicleButtonTextActive: {
    color: colors.text,
  },
  badgeContainer: {
    marginTop: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  saveRow: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.muted,
  },
  logoutSection: {
    marginTop: spacing.xl,
  },
  logoutButton: {
    width: '100%',
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
