import { Ionicons } from '@expo/vector-icons';
import { router, useSegments, type Href } from 'expo-router';
import { type DrawerContentComponentProps } from 'expo-router/drawer';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShops } from '@/context/ShopContext';
import type { Shop } from '@/lib/types';
import { palette } from '@/theme/colors';

type NavigationItem = { title: string; icon: keyof typeof Ionicons.glyphMap; href: Href; route: string };
const groups: { label: string; items: NavigationItem[] }[] = [
  { label: 'General', items: [{ title: 'Overview', icon: 'grid-outline', href: '/(business)/(tabs)', route: 'index' }] },
  { label: 'Catalog & Sales', items: [
    { title: 'Products & Inventory', icon: 'cube-outline', href: '/(business)/(tabs)/products', route: 'products' },
    { title: 'Add Product', icon: 'add-circle-outline', href: '/create-product', route: 'create-product' },
    { title: 'Orders', icon: 'receipt-outline', href: '/(business)/(tabs)/orders', route: 'orders' },
    { title: 'Record a sale', icon: 'cash-outline', href: '/(business)/(tabs)/sell', route: 'sell' },
  ] },
  { label: 'Growth', items: [{ title: 'Events & Tickets', icon: 'calendar-outline', href: '/events', route: 'events' }] },
  { label: 'Workspace', items: [
    { title: 'Settings', icon: 'settings-outline', href: '/(business)/(tabs)/settings', route: 'settings' },
    { title: 'Sync & storage', icon: 'cloud-upload-outline', href: '/sync-queue', route: 'sync-queue' },
  ] },
];

function ShopAvatar({ shop, size = 36 }: { shop: Shop | null; size?: number }) {
  const uri = shop?.logo_url || shop?.image_url;
  const initials = (shop?.name || 'XB').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return <View style={[styles.avatar, { width: size, height: size }]}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size }} /> : <Text style={styles.avatarText}>{initials}</Text>}
  </View>;
}

function ShopLabel({ shop }: { shop: Shop | null }) {
  return <View style={{ flex: 1 }}><Text style={styles.shopName} numberOfLines={1}>{shop?.name || 'Your shop'}</Text>
    <Text style={styles.shopMeta} numberOfLines={1}>{shop?.seller_access === 'owner' ? 'Owner' : shop?.access_level || 'Workspace'}{shop?.handle ? ' · @' + shop.handle.replace(/^@/, '') : ''}</Text>
  </View>;
}

export function BusinessHeader({ onMenu }: { onMenu: () => void }) {
  const { currentShop, shops, selectShop } = useShops();
  const { top } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const segments = useSegments();
  const current = segments[segments.length - 1];
  const title = current === '(tabs)' || current === 'index' ? 'Overview' : current === 'sell' ? 'Record a sale' : String(current).replace(/^./, (c) => c.toUpperCase());
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const choose = async (shop: Shop) => { await selectShop(shop); setSwitcherOpen(false); };

  return <>
    <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open business navigation" onPress={onMenu} style={styles.menuButton}><Ionicons name="menu-outline" size={23} color={palette.ink} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" accessibilityState={{ expanded: switcherOpen }} onPress={() => setSwitcherOpen(true)} style={styles.shopSwitch}>
          <ShopAvatar shop={currentShop} /><ShopLabel shop={currentShop} /><Ionicons name="chevron-down" size={17} color={palette.muted} />
        </Pressable>
        <View style={styles.crumb}><Text style={styles.crumbBrand}>Xonbay Business</Text><Ionicons name="chevron-forward" size={13} color={palette.muted} /><Text style={styles.crumbCurrent}>{title}</Text></View>
      </View>
    </SafeAreaView>
    <Modal visible={switcherOpen} transparent statusBarTranslucent animationType="fade" onRequestClose={() => setSwitcherOpen(false)}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close workspace switcher" style={StyleSheet.absoluteFill} onPress={() => setSwitcherOpen(false)} />
        <View style={[styles.switcher, { top: top + 67, width: Math.min(width - 32, 380) }]}>
          <Text style={styles.switchTitle}>SWITCH WORKSPACE</Text>
          <ScrollView style={{ maxHeight: Math.min(height * 0.42, 320) }} keyboardShouldPersistTaps="handled">
            {shops.map((shop) => { const selected = String(shop.id) === String(currentShop?.id); return <Pressable key={shop.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => void choose(shop)} style={[styles.shopOption, selected && styles.selected]}>
              <ShopAvatar shop={shop} size={30} /><View style={{ flex: 1 }}><Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text><Text style={styles.shopMeta} numberOfLines={1}>{shop.handle ? '@' + shop.handle.replace(/^@/, '') + ' · ' : ''}{shop.seller_access === 'owner' ? 'Owner' : shop.access_level || 'Member'}</Text></View>
              {selected && <Ionicons name="checkmark" size={18} color={palette.primary} />}
            </Pressable>; })}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => { setSwitcherOpen(false); router.push('/create-shop'); }} style={styles.newShop}><Ionicons name="add-circle-outline" size={19} color={palette.primary} /><Text style={styles.newShopText}>Create New Shop</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

export function BusinessDrawerContent({ navigation }: DrawerContentComponentProps) {
  const { currentShop, shops, selectShop } = useShops();
  const segments = useSegments();
  const route = segments[segments.length - 1] === '(tabs)' ? 'index' : String(segments[segments.length - 1]);
  const [showShops, setShowShops] = useState(false);
  const navigate = (href: Href) => { navigation.closeDrawer(); setShowShops(false); router.push(href); };
  const choose = async (shop: Shop) => { await selectShop(shop); navigation.closeDrawer(); setShowShops(false); router.replace('/(business)/(tabs)'); };
  return <SafeAreaView edges={['top', 'bottom']} style={styles.drawer}>
    <View style={styles.drawerHeading}><Text style={styles.drawerTitle}>Xonbay Business</Text><Pressable accessibilityRole="button" accessibilityLabel="Close navigation" onPress={() => navigation.closeDrawer()} style={styles.close}><Ionicons name="close" size={21} color={palette.ink} /></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" accessibilityState={{ expanded: showShops }} onPress={() => setShowShops((open) => !open)} style={styles.drawerShop}><ShopAvatar shop={currentShop} size={34} /><ShopLabel shop={currentShop} /><Ionicons name="chevron-down" size={16} color={palette.muted} /></Pressable>
    {showShops && <View style={styles.drawerSwitcher}>
      <ScrollView style={{ maxHeight: 205 }} nestedScrollEnabled>{shops.map((shop) => <Pressable key={shop.id} accessibilityRole="button" onPress={() => void choose(shop)} style={styles.shopOption}><ShopAvatar shop={shop} size={28} /><ShopLabel shop={shop} />{String(shop.id) === String(currentShop?.id) && <Ionicons name="checkmark" size={17} color={palette.primary} />}</Pressable>)}</ScrollView>
      <Pressable accessibilityRole="button" onPress={() => navigate('/create-shop')} style={styles.newShop}><Ionicons name="add-circle-outline" size={18} color={palette.primary} /><Text style={styles.newShopText}>Create New Shop</Text></Pressable>
    </View>}
    <ScrollView contentContainerStyle={styles.navContent}>{groups.map((group) => <View key={group.label} style={styles.group}><Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
      {group.items.map((item) => { const active = item.route === route; return <Pressable key={item.title} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => navigate(item.href)} style={[styles.navItem, active && styles.navSelected]}><Ionicons name={item.icon} size={19} color={active ? palette.primary : palette.textSecondary} /><Text style={[styles.navText, active && styles.navTextSelected]}>{item.title}</Text></Pressable>; })}
    </View>)}</ScrollView>
    <View style={styles.drawerFoot}><Pressable accessibilityRole="button" onPress={() => navigate('/workspace')} style={styles.navItem}><Ionicons name="storefront-outline" size={19} color={palette.textSecondary} /><Text style={styles.navText}>All shops</Text><Ionicons name="arrow-forward" size={16} color={palette.muted} /></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  headerSafe: { backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.border },
  header: { minHeight: 72, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  menuButton: { width: 41, height: 41, borderWidth: 1, borderColor: palette.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shopSwitch: { flex: 1, minWidth: 0, minHeight: 41, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surface },
  avatar: { borderRadius: 8, overflow: 'hidden', backgroundColor: palette.surfaceSoft, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '900', color: palette.primary },
  shopName: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  shopMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  crumb: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 2 },
  crumbBrand: { color: palette.muted, fontSize: 10, fontWeight: '700' }, crumbCurrent: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: palette.overlaySoft, alignItems: 'center' },
  switcher: { position: 'absolute', backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 7 },
  switchTitle: { color: palette.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, paddingHorizontal: 9, paddingVertical: 10 },
  shopOption: { minHeight: 48, flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 9, borderRadius: 9 },
  selected: { backgroundColor: palette.primaryMuted },
  newShop: { borderTopWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, minHeight: 44 },
  newShopText: { color: palette.primary, fontWeight: '800', fontSize: 12 },
  drawer: { flex: 1, backgroundColor: palette.surface, borderRightWidth: 1, borderRightColor: palette.border },
  drawerHeading: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.border },
  drawerTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  close: { height: 36, width: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  drawerShop: { margin: 9, borderWidth: 1, borderColor: palette.border, borderRadius: 10, minHeight: 55, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  drawerSwitcher: { marginHorizontal: 9, marginBottom: 9, borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 5 },
  navContent: { paddingHorizontal: 9, paddingBottom: 18 },
  group: { marginBottom: 10 },
  groupLabel: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, paddingHorizontal: 11, paddingVertical: 10 },
  navItem: { minHeight: 41, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 9 },
  navSelected: { backgroundColor: palette.primaryMuted },
  navText: { flex: 1, color: palette.textSecondary, fontSize: 13, fontWeight: '700' },
  navTextSelected: { color: palette.primary, fontWeight: '900' },
  drawerFoot: { borderTopWidth: 1, borderColor: palette.border, padding: 9 },
});
