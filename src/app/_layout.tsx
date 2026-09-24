import { Stack } from 'expo-router';
import { SessionProvider } from '@/lib/session';
import { colors } from '@/components/ui';
export default function RootLayout() { return <SessionProvider><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.background }, headerBackTitle: 'Terug' }}>
  <Stack.Screen name="index" options={{ title: 'Gesprekken', headerLargeTitle: true }} />
  <Stack.Screen name="auth" options={{ title: 'Aanmelden' }} />
  <Stack.Screen name="new" options={{ title: 'Nieuw gesprek' }} />
  <Stack.Screen name="profile" options={{ title: 'Mijn profiel' }} />
  <Stack.Screen name="chat/[id]" options={{ title: 'Gesprek' }} />
</Stack></SessionProvider>; }
