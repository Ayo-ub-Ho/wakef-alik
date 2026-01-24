import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="nearby" />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="deliveries" />
      <Stack.Screen name="request/[id]" />
    </Stack>
  );
}
