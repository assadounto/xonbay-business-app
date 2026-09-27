import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { palette } from '@/components/ui';

export default function BusinessTabs() {
  const { loaded, user } = useAuth();
  const { bottom } = useSafeAreaInsets();
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: palette.background },
      tabBarActiveTintColor: palette.primary,
      tabBarInactiveTintColor: palette.muted,
      tabBarActiveBackgroundColor: palette.primaryMuted,
      tabBarHideOnKeyboard: true,
      tabBarLabelStyle: { fontWeight: '700', fontSize: 10 },
      tabBarItemStyle: { borderRadius: 16, marginHorizontal: 3, marginTop: 7, marginBottom: 5 },
      tabBarStyle: {
        height: 62 + bottom, paddingBottom: Math.max(bottom, 6), paddingTop: 2,
        backgroundColor: palette.surface, borderTopColor: palette.border,
        borderTopWidth: 1, elevation: 0, shadowOpacity: 0,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="sell" options={{ title: 'Sell', tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
