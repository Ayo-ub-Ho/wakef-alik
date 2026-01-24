import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import * as Location from 'expo-location';
import { useRequestsStore } from '../../../src/stores/requests.store';
import { useRestaurantStore } from '../../../src/stores/restaurant.store';
import { GeoJSONPoint } from '../../../src/types/models';

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
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetPickupLocation = async () => {
    setLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get GPS coordinates.',
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

      setPickupLocation(geoPoint);
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Error', 'Failed to get your location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleGetDropoffLocation = async () => {
    setLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get GPS coordinates.',
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

      setDropoffLocation(geoPoint);
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Error', 'Failed to get your location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!pickupAddressText.trim()) {
      Alert.alert('Error', 'Please enter a pickup address');
      return;
    }
    if (!pickupLocation) {
      Alert.alert('Error', 'Please set the pickup location using GPS');
      return;
    }
    if (!dropoffAddressText.trim()) {
      Alert.alert('Error', 'Please enter a dropoff address');
      return;
    }
    if (!dropoffLocation) {
      Alert.alert('Error', 'Please set the dropoff location using GPS');
      return;
    }
    if (!deliveryFee.trim() || isNaN(parseFloat(deliveryFee))) {
      Alert.alert('Error', 'Please enter a valid delivery fee');
      return;
    }
    if (!profile?._id) {
      Alert.alert('Error', 'Restaurant profile not found');
      return;
    }

    try {
      clearError();
      await create({
        restaurantId: profile._id,
        pickupLocation,
        pickupAddressText: pickupAddressText.trim(),
        dropoffLocation,
        dropoffAddressText: dropoffAddressText.trim(),
        deliveryFee: parseFloat(deliveryFee),
        notes: notes.trim() || undefined,
      });

      router.replace('/restaurant/requests' as Href);
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

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
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
                locationLoading && styles.buttonDisabled,
              ]}
              onPress={handleGetPickupLocation}
              disabled={locationLoading || loading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <Text style={styles.gpsButtonText}>📍 Use Current GPS</Text>
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
                locationLoading && styles.buttonDisabled,
              ]}
              onPress={handleGetDropoffLocation}
              disabled={locationLoading || loading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <Text style={styles.gpsButtonText}>📍 Use Current GPS</Text>
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
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
  gpsButtonText: {
    color: '#34C759',
    fontWeight: '600',
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
