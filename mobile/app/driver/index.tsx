import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useDriverStore } from '../../src/stores/driver.store';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuthStore();
  const {
    profile,
    loading: profileLoading,
    availabilityLoading,
    error,
    fetchProfile,
    toggleAvailability,
    clearError,
  } = useDriverStore();

  // Track if we've already checked profile to avoid loops
  const hasCheckedProfile = useRef(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to profile screen if no profile exists
  useEffect(() => {
    // Wait until profile fetch completes
    if (profileLoading) return;

    // Only check once to avoid loops
    if (hasCheckedProfile.current) return;
    hasCheckedProfile.current = true;

    // If no profile, redirect to profile creation
    if (profile === null) {
      router.replace('/driver/profile' as Href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading]);

  const handleLogout = async () => {
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

  const handleEditProfile = () => {
    hasCheckedProfile.current = false; // Reset for next visit
    router.push('/driver/profile' as Href);
  };

  const handleToggleAvailability = async (value: boolean) => {
    try {
      await toggleAvailability(value);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Show loading while checking profile
  if (profileLoading) {
    return <LoadingView text="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Home</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.fullName || 'Driver'}!
        </Text>
      </View>

      <View style={styles.content}>
        {error && <ErrorBanner message={error} onDismiss={clearError} />}
        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>✅ Profile OK</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValue}>{profile.vehicleType}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Delivery Box</Text>
              <Text style={styles.infoValue}>
                {profile.hasDeliveryBox ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Verification</Text>
              <Text style={styles.infoValue}>
                {profile.isVerified ? 'Verified ✓' : 'Pending'}
              </Text>
            </View>
          </View>
        )}

        {/* Availability Switch */}
        {profile && (
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityLabel}>
                Available for Deliveries
              </Text>
              <Text style={styles.availabilityHint}>
                {profile.isAvailable
                  ? 'You will appear in nearby searches'
                  : 'Turn on to receive delivery requests'}
              </Text>
            </View>
            <View style={styles.switchContainer}>
              {availabilityLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Switch
                  value={profile.isAvailable ?? false}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: '#ccc', true: '#4CD964' }}
                  thumbColor="#fff"
                />
              )}
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Driver Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/driver/nearby' as Href)}
          >
            <Text style={styles.actionButtonText}>📍 Nearby Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/driver/inbox' as Href)}
          >
            <Text style={styles.actionButtonText}>📥 Offers Inbox</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/driver/deliveries' as Href)}
          >
            <Text style={styles.actionButtonText}>🚚 My Deliveries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.logoutButton, authLoading && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
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
  content: {
    flex: 1,
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availabilityInfo: {
    flex: 1,
    marginRight: 12,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  availabilityHint: {
    fontSize: 12,
    color: '#666',
  },
  switchContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 24,
  },
  actionsSectionTitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
