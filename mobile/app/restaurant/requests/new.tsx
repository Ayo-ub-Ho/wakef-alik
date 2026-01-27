/**
 * New Request Screen - Stitch Style
 * Form to create a new delivery request
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { useRestaurantStore } from '../../../src/stores/restaurant.store';
import { GeoJSONPoint } from '../../../src/types/models';
import { AppScreen } from '../../../src/components/ui/AppScreen';
import { Card } from '../../../src/components/ui/Card';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { ErrorBanner } from '../../../src/components/ErrorBanner';
import { colors, typography, spacing, radius } from '../../../src/theme/tokens';

type LocationErrorType = 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNKNOWN' | null;

export default function NewRequestScreen() {
  const router = useRouter();
  const { create, loading, error, clearError } = useRequestsStore();
  const { profile } = useRestaurantStore();

  const [pickupAddressText, setPickupAddressText] = useState(
    profile?.addressText || '',
  );
  const [pickupLocation, setPickupLocation] = useState<GeoJSONPoint | null>(
    profile?.location || null,
  );
  const [dropoffAddressText, setDropoffAddressText] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState<GeoJSONPoint | null>(
    null,
  );
  const [deliveryFee, setDeliveryFee] = useState('');
  const [notes, setNotes] = useState('');
  const [locationLoading, setLocationLoading] = useState<
    'pickup' | 'dropoff' | null
  >(null);
  const [locationError, setLocationError] = useState<LocationErrorType>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = () => setValidationError(null);

  const handleGetLocation = async (type: 'pickup' | 'dropoff') => {
    setLocationLoading(type);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('PERMISSION_DENIED');
        setLocationLoading(null);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
      });

      const geoPoint: GeoJSONPoint = {
        type: 'Point',
        coordinates: [position.coords.longitude, position.coords.latitude],
      };

      if (type === 'pickup') {
        setPickupLocation(geoPoint);
      } else {
        setDropoffLocation(geoPoint);
      }
    } catch (err) {
      console.error('Location error:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('timeout')) {
        setLocationError('TIMEOUT');
      } else {
        setLocationError('UNKNOWN');
      }
    } finally {
      setLocationLoading(null);
    }
  };

  const getLocationErrorMessage = (): string => {
    switch (locationError) {
      case 'PERMISSION_DENIED':
        return 'Location permission denied. Please enable location access in your device settings.';
      case 'TIMEOUT':
        return 'Location request timed out. Please try again in an open area.';
      case 'UNKNOWN':
        return 'Failed to get location. Please try again.';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    clearValidationError();

    if (!pickupAddressText.trim()) {
      setValidationError('Please enter a pickup address');
      return false;
    }

    if (!pickupLocation) {
      setValidationError('Please set the pickup location using GPS');
      return false;
    }

    if (!dropoffAddressText.trim()) {
      setValidationError('Please enter a dropoff address');
      return false;
    }

    if (!dropoffLocation) {
      setValidationError('Please set the dropoff location using GPS');
      return false;
    }

    const feeValue = parseFloat(deliveryFee);
    if (!deliveryFee.trim() || isNaN(feeValue) || feeValue < 0) {
      setValidationError('Please enter a valid delivery fee (0 or greater)');
      return false;
    }

    if (!profile?._id) {
      setValidationError(
        'Restaurant profile not found. Please set up your profile first.',
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      const restaurantId = profile?._id;
      if (!restaurantId) {
        setValidationError('Restaurant profile not found');
        return;
      }
      const newRequest = await create({
        restaurantId,
        pickupLocation: pickupLocation!,
        pickupAddressText: pickupAddressText.trim(),
        dropoffLocation: dropoffLocation!,
        dropoffAddressText: dropoffAddressText.trim(),
        deliveryFee: parseFloat(deliveryFee),
        notes: notes.trim() || undefined,
      });

      // Navigate to details with the created request data
      router.replace({
        pathname: `/restaurant/requests/[id]` as const,
        params: {
          id: newRequest._id,
          data: JSON.stringify(newRequest),
        },
      });
    } catch (err) {
      console.error('Create request failed:', err);
    }
  };

  return (
    <AppScreen noPadding>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Delivery Request</Text>
            <Text style={styles.subtitle}>
              Fill in pickup & dropoff details
            </Text>
          </View>

          {/* Errors */}
          <View style={styles.content}>
            {(error || validationError) && (
              <ErrorBanner
                message={validationError || error || ''}
                onDismiss={validationError ? clearValidationError : clearError}
              />
            )}

            {locationError && (
              <ErrorBanner
                message={getLocationErrorMessage()}
                onDismiss={() => setLocationError(null)}
              />
            )}

            {/* Pickup Section */}
            <SectionHeader title="Pickup Location" emoji="🏪" />
            <Card style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter pickup address"
                  placeholderTextColor={colors.muted}
                  value={pickupAddressText}
                  onChangeText={setPickupAddressText}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.gpsButton,
                  locationLoading === 'pickup' && styles.buttonDisabled,
                  pickupLocation && styles.gpsButtonSuccess,
                ]}
                onPress={() => handleGetLocation('pickup')}
                disabled={locationLoading !== null || loading}
              >
                {locationLoading === 'pickup' ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <Text
                    style={[
                      styles.gpsButtonText,
                      pickupLocation && styles.gpsButtonTextSuccess,
                    ]}
                  >
                    {pickupLocation
                      ? '✓ Location Set (Tap to Update)'
                      : '📍 Use Current GPS'}
                  </Text>
                )}
              </TouchableOpacity>

              {pickupLocation && (
                <View style={styles.coordsBadge}>
                  <Text style={styles.coordsText}>
                    📍 {pickupLocation.coordinates[1].toFixed(5)},{' '}
                    {pickupLocation.coordinates[0].toFixed(5)}
                  </Text>
                </View>
              )}
            </Card>

            {/* Dropoff Section */}
            <SectionHeader title="Dropoff Location" emoji="📍" />
            <Card style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter dropoff address"
                  placeholderTextColor={colors.muted}
                  value={dropoffAddressText}
                  onChangeText={setDropoffAddressText}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.gpsButton,
                  locationLoading === 'dropoff' && styles.buttonDisabled,
                  dropoffLocation && styles.gpsButtonSuccess,
                ]}
                onPress={() => handleGetLocation('dropoff')}
                disabled={locationLoading !== null || loading}
              >
                {locationLoading === 'dropoff' ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <Text
                    style={[
                      styles.gpsButtonText,
                      dropoffLocation && styles.gpsButtonTextSuccess,
                    ]}
                  >
                    {dropoffLocation
                      ? '✓ Location Set (Tap to Update)'
                      : '📍 Use Current GPS'}
                  </Text>
                )}
              </TouchableOpacity>

              {dropoffLocation && (
                <View style={styles.coordsBadge}>
                  <Text style={styles.coordsText}>
                    📍 {dropoffLocation.coordinates[1].toFixed(5)},{' '}
                    {dropoffLocation.coordinates[0].toFixed(5)}
                  </Text>
                </View>
              )}
            </Card>

            {/* Fee & Notes */}
            <SectionHeader title="Delivery Details" emoji="💰" />
            <Card style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Delivery Fee (MAD)</Text>
                <TextInput
                  style={[styles.input, styles.feeInput]}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Special instructions for the driver..."
                  placeholderTextColor={colors.muted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>
            </Card>

            {/* Summary Card (only show when both locations set) */}
            {pickupLocation && dropoffLocation && (
              <Card style={[styles.card, styles.summaryCard]}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>From:</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {pickupAddressText || 'Not set'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>To:</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {dropoffAddressText || 'Not set'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fee:</Text>
                  <Text style={styles.summaryFee}>
                    {deliveryFee ? `${deliveryFee} MAD` : 'Not set'}
                  </Text>
                </View>
              </Card>
            )}

            {/* Submit Button */}
            <PrimaryButton
              title={loading ? 'Creating...' : 'Create Request'}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
  content: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text,
  },
  feeInput: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  gpsButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  gpsButtonSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  gpsButtonText: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.md,
  },
  gpsButtonTextSuccess: {
    color: colors.success,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  coordsBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    alignSelf: 'center',
  },
  coordsText: {
    fontSize: typography.size.xs,
    color: colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  summaryCard: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  summaryTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.muted,
    width: 50,
  },
  summaryValue: {
    fontSize: typography.size.md,
    color: colors.text,
    flex: 1,
  },
  summaryFee: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
