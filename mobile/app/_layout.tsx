import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments, Href } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

/**
 * Loading screen shown during hydration
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

/**
 * Root layout with authentication routing guard
 */
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isHydrated, user, hydrate } = useAuthStore();

  // Hydrate auth state on app start
  useEffect(() => {
    hydrate();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isHydrated) {
      // Still loading, don't navigate yet
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inDriverGroup = segments[0] === 'driver';
    const inRestaurantGroup = segments[0] === 'restaurant';

    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login' as Href);
      }
    } else {
      // Authenticated, redirect based on role
      if (inAuthGroup) {
        // User is on auth screens but already authenticated
        if (user?.role === 'DRIVER') {
          router.replace('/driver' as Href);
        } else if (user?.role === 'RESTAURANT') {
          router.replace('/restaurant' as Href);
        }
      } else if (user?.role === 'DRIVER' && !inDriverGroup) {
        // Driver trying to access non-driver routes
        router.replace('/driver' as Href);
      } else if (user?.role === 'RESTAURANT' && !inRestaurantGroup) {
        // Restaurant trying to access non-restaurant routes
        router.replace('/restaurant' as Href);
      }
    }
  }, [isAuthenticated, isHydrated, user, segments]);

  // Show loading screen while hydrating
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
      <Stack.Screen name="restaurant" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
