/**
 * Restaurant Index - Redirects to Requests tab
 * The main content is now in the bottom tab bar
 */
import { useEffect } from 'react';
import { useRouter, Href } from 'expo-router';

export default function RestaurantIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to requests which is the main home tab
    router.replace('/restaurant/requests' as Href);
  }, [router]);

  return null;
}
