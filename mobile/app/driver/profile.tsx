import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useDriverStore } from '../../src/stores/driver.store';
import { VehicleType } from '../../src/types/models';

const VEHICLE_TYPES: VehicleType[] = ['BIKE', 'MOTORCYCLE', 'CAR', 'VAN'];

export default function DriverProfileScreen() {
  const router = useRouter();
  const { profile, loading, error, saveProfile, fetchProfile, clearError } =
    useDriverStore();

  const [vehicleType, setVehicleType] = useState<VehicleType>('BIKE');
  const [hasDeliveryBox, setHasDeliveryBox] = useState(false);

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
      router.replace('/driver' as Href);
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
        <Text style={styles.title}>Driver Profile</Text>
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
          <Text style={styles.label}>Vehicle Type</Text>
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
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Delivery Box</Text>
            <Text style={styles.switchDescription}>
              Do you have a delivery box for food?
            </Text>
          </View>
          <Switch
            value={hasDeliveryBox}
            onValueChange={setHasDeliveryBox}
            disabled={loading}
            trackColor={{ false: '#ddd', true: '#81b0ff' }}
            thumbColor={hasDeliveryBox ? '#007AFF' : '#f4f3f4'}
          />
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
    backgroundColor: '#007AFF',
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
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  vehicleButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  vehicleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  vehicleButtonTextActive: {
    color: '#007AFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
