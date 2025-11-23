import { Stack } from 'expo-router';

import { NOTO_SANS_JP } from '@/constants/Typography';

export default function CompaniesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: NOTO_SANS_JP.semibold },
        headerBackTitleStyle: { fontFamily: NOTO_SANS_JP.medium },
        headerLargeTitleStyle: { fontFamily: NOTO_SANS_JP.bold },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: true }} />
      <Stack.Screen name="[id]/edit" options={{ headerShown: true }} />
    </Stack>
  );
}
