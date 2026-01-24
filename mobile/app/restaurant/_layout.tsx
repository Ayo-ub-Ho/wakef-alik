import { Stack } from 'expo-router';

export default function RestaurantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="requests/index" />
      <Stack.Screen name="requests/new" />
      <Stack.Screen name="requests/[id]" />
    </Stack>
  );
}
