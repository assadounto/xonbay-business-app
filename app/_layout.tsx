import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { palette } from '@/components/ui';
import { AuthProvider } from '@/context/AuthContext';
import { ShopProvider } from '@/context/ShopContext';
import { SyncProvider } from '@/context/SyncContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: palette.background }}>
      <AuthProvider>
        <ShopProvider>
          <SyncProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="create-shop" />
            <Stack.Screen name="create-product" />
            <Stack.Screen name="events" />
            <Stack.Screen name="create-event" />
            <Stack.Screen name="sync-queue" />
            <Stack.Screen name="(tabs)" />
            </Stack>
          </SyncProvider>
        </ShopProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
