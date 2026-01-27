/**
 * Restaurant Profile Edit Screen - Stitch Style
 * Create or edit restaurant profile
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useRestaurantStore } from '../../src/stores/restaurant.store';
import { GeoJSONPoint } from '../../src/types/models';
import { AppScreen } from '../../src/components/ui/AppScreen';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { colors, typography, spacing, radius } from '../../src/theme/tokens';

export default function RestaurantProfileEditScreen() {
  const router = useRouter();
  const { profile, loading, error, saveProfile, fetchProfile, clearError } =
    useRestaurantStore();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [addressText, setAddressText] = useState('');
  const [location, setLocation] = useState<GeoJSONPoint | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing profile data if available
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setRestaurantName(profile.restaurantName);
      setOwnerName(profile.ownerName);
      setAddressText(profile.addressText);
      setLocation(profile.location);
    }
  }, [profile]);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setValidationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setValidationError(
          'Location permission denied. Please enable in settings.',
        );
        setLocationLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geoPoint: GeoJSONPoint = {
        type: 'Point',
        coordinates: [position.coords.longitude, position.coords.latitude],
      };

      setLocation(geoPoint);
    } catch (err) {
      console.error('Location error:', err);
      setValidationError('Failed to get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    setValidationError(null);

    // Basic validation
    if (!restaurantName.trim()) {
      setValidationError('Please enter a restaurant name');
      return;
    }
    if (!ownerName.trim()) {
      setValidationError('Please enter an owner name');
      return;
    }
    if (!addressText.trim()) {
      setValidationError('Please enter an address');
      return;
    }
    if (!location) {
      setValidationError('Please set your location using the GPS button');
      return;
    }

    try {
      clearError();
      await saveProfile({
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        addressText: addressText.trim(),
        location,
      });
      router.back();
    } catch (err) {
      console.error('Save profile failed:', err);
    }
  };

  return (
    <AppScreen scroll>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {profile ? 'Edit Profile' : 'Create Profile'}
        </Text>
        <Text style={styles.subtitle}>
          {profile
            ? 'Update your restaurant details'
            : 'Complete your profile to start'}
        </Text>
      </View>

      {(error || validationError) && (
        <ErrorBanner
          message={validationError || error || ''}
          onDismiss={() => {
            setValidationError(null);
            if (error) clearError();
          }}
        />
      )}

      {/* Basic Info Section */}
      <SectionHeader title="Basic Information" />

      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter restaurant name"
            placeholderTextColor={colors.placeholder}
            value={restaurantName}
            onChangeText={setRestaurantName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Owner Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter owner name"
            placeholderTextColor={colors.placeholder}
            value={ownerName}
            onChangeText={setOwnerName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroupLast}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Enter full address"
            placeholderTextColor={colors.placeholder}
            value={addressText}
            onChangeText={setAddressText}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>
      </Card>

      {/* Location Section */}
      <SectionHeader title="Location" />

      <Card>
        <View style={styles.locationContent}>
          <TouchableOpacity
            style={[
              styles.gpsButton,
              location && styles.gpsButtonSuccess,
              locationLoading && styles.gpsButtonDisabled,
            ]}
            onPress={handleGetLocation}
            disabled={locationLoading || loading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text
                style={[
                  styles.gpsButtonText,
                  location && styles.gpsButtonTextSuccess,
                ]}
              >
                {location ? '✓ Location Set' : '📍 Use current GPS location'}
              </Text>
            )}
          </TouchableOpacity>

          {location && (
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsLabel}>COORDINATES</Text>
              <Text style={styles.coordsText}>
                {location.coordinates[1].toFixed(6)},{' '}
                {location.coordinates[0].toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <PrimaryButton
          title={profile ? 'Save Changes' : 'Create Profile'}
          onPress={handleSave}
          loading={loading}
          disabled={loading}
        />

        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: typography.size.md,
    color: colors.muted,
    fontWeight: typography.weight.medium,
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputGroupLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: typography.size.md,
    color: colors.text,
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationContent: {
    alignItems: 'center',
  },
  gpsButton: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    width: '100%',
    alignItems: 'center',
  },
  gpsButtonSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  gpsButtonTextSuccess: {
    color: colors.success,
  },
  coordsBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  coordsLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  coordsText: {
    fontSize: typography.size.sm,
    color: colors.text,
    fontFamily: 'monospace',
  },
  actions: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
});
