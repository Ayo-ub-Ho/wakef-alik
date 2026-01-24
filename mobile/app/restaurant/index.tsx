import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRestaurantStore } from '../../src/stores/restaurant.store';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorBanner } from '../../src/components/ErrorBanner';

export default function RestaurantHomeScreen() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuthStore();
  const {
    profile,
    loading: profileLoading,
    error,
    fetchProfile,
    clearError,
  } = useRestaurantStore();

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
      router.replace('/restaurant/profile' as Href);
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
    router.push('/restaurant/profile' as Href);
  };

  // Show loading while checking profile
  if (profileLoading) {
    return <LoadingView text="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Home</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.fullName || 'Restaurant'}!
        </Text>
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={fetchProfile}
          onDismiss={clearError}
        />
      )}

      <View style={styles.content}>
        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>✅ Profile OK</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Restaurant</Text>
              <Text style={styles.infoValue}>{profile.restaurantName}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Owner</Text>
              <Text style={styles.infoValue}>{profile.ownerName}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{profile.addressText}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {profile.isVerified ? 'Verified ✓' : 'Pending Verification'}
              </Text>
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

        <TouchableOpacity
          style={styles.requestsButton}
          onPress={() => router.push('/restaurant/requests' as Href)}
        >
          <Text style={styles.requestsButtonText}>📦 My Delivery Requests</Text>
        </TouchableOpacity>
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
    marginBottom: 8,
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
    borderColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  requestsButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  requestsButtonText: {
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
