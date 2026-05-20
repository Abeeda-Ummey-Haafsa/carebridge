import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="caregiver" />
      <Stack.Screen name="elder" />
      <Stack.Screen name="relative" />
    </Stack>
  );
}
