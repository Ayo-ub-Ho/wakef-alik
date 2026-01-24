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
import { ErrorBanner } from '../../../src/components/ErrorBanner';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Delivery Request</Text>
        </View>

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

        <View style={styles.formContainer}>
          {/* Pickup Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Pickup</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pickup Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                placeholderTextColor="#999"
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
                <ActivityIndicator size="small" color="#34C759" />
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
              <Text style={styles.coordsText}>
                Lat: {pickupLocation.coordinates[1].toFixed(6)}, Lng:{' '}
                {pickupLocation.coordinates[0].toFixed(6)}
              </Text>
            )}
          </View>

          {/* Dropoff Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Dropoff</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dropoff Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter dropoff address"
                placeholderTextColor="#999"
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
                <ActivityIndicator size="small" color="#34C759" />
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
              <Text style={styles.coordsText}>
                Lat: {dropoffLocation.coordinates[1].toFixed(6)}, Lng:{' '}
                {dropoffLocation.coordinates[0].toFixed(6)}
              </Text>
            )}
          </View>

          {/* Fee & Notes */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Delivery Fee ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#999"
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
                placeholder="Special instructions..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  gpsButton: {
    borderWidth: 2,
    borderColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsButtonSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  gpsButtonText: {
    color: '#34C759',
    fontWeight: '600',
  },
  gpsButtonTextSuccess: {
    color: '#2e7d32',
  },
  coordsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
