import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import * as Location from 'expo-location';
import { useRestaurantStore } from '../../src/stores/restaurant.store';
import { GeoJSONPoint } from '../../src/types/models';

export default function RestaurantProfileScreen() {
  const router = useRouter();
  const { profile, loading, error, saveProfile, fetchProfile, clearError } =
    useRestaurantStore();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [addressText, setAddressText] = useState('');
  const [location, setLocation] = useState<GeoJSONPoint | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

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

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your GPS coordinates. Please enable it in settings.',
          [{ text: 'OK' }],
        );
        setLocationLoading(false);
        return;
      }

      // Get current position
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
      Alert.alert(
        'Location Error',
        'Failed to get your location. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!restaurantName.trim() || !ownerName.trim() || !addressText.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please set your location using the GPS button');
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
      router.replace('/restaurant' as Href);
    } catch (err) {
      // Error is already set in store
      console.error('Save profile failed:', err);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Profile</Text>
        <Text style={styles.subtitle}>
          {profile ? 'Update your profile' : 'Complete your profile to start'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter restaurant name"
            placeholderTextColor="#999"
            value={restaurantName}
            onChangeText={setRestaurantName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Owner Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter owner name"
            placeholderTextColor="#999"
            value={ownerName}
            onChangeText={setOwnerName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Enter full address"
            placeholderTextColor="#999"
            value={addressText}
            onChangeText={setAddressText}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              locationLoading && styles.buttonDisabled,
            ]}
            onPress={handleGetLocation}
            disabled={locationLoading || loading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.locationButtonText}>
                📍 Use Current GPS Location
              </Text>
            )}
          </TouchableOpacity>

          {location && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesLabel}>Coordinates:</Text>
              <Text style={styles.coordinatesText}>
                Lat: {location.coordinates[1].toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Lng: {location.coordinates[0].toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {profile ? 'Update Profile' : 'Create Profile'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coordinatesContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
