import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { BusinessDrawerContent, BusinessHeader } from '@/components/BusinessNavigation';
import { palette } from '@/theme/colors';

export default function BusinessLayout() {
  const { width } = useWindowDimensions();
  return <Drawer
    drawerContent={(props) => <BusinessDrawerContent {...props} />}
    screenOptions={{
      header: ({ navigation }) => <BusinessHeader onMenu={() => navigation.toggleDrawer()} />,
      drawerPosition: 'left',
      drawerType: 'back',
      overlayColor: 'transparent',
      swipeEnabled: true,
      swipeEdgeWidth: 56,
      drawerStyle: { width: Math.min(width * 0.86, 320), backgroundColor: palette.surface, borderRightWidth: 1, borderRightColor: palette.border, elevation: 0, shadowOpacity: 0 },
      sceneStyle: { backgroundColor: palette.background },
    }}
  >
    <Drawer.Screen name="(tabs)" options={{ title: 'Business' }} />
  </Drawer>;
}
