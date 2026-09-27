import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShops } from '@/context/ShopContext';
import type { Shop } from '@/lib/types';
import { palette } from '@/theme/colors';

type NavigationItem = { title: string; icon: keyof typeof Ionicons.glyphMap; href: Href };
const groups: { label: string; items: NavigationItem[] }[] = [
  { label: 'General', items: [{ title: 'Overview', icon: 'grid-outline', href: '/(tabs)' }] },
  { label: 'Catalog & Sales', items: [
    { title: 'Products & Inventory', icon: 'cube-outline', href: '/(tabs)/products' },
    { title: 'Add Product', icon: 'add-circle-outline', href: '/create-product' },
    { title: 'Orders', icon: 'receipt-outline', href: '/(tabs)/orders' },
    { title: 'Record a sale', icon: 'cash-outline', href: '/(tabs)/sell' },
  ] },
  { label: 'Growth', items: [{ title: 'Events & Tickets', icon: 'calendar-outline', href: '/events' }] },
  { label: 'Workspace', items: [
    { title: 'Settings', icon: 'settings-outline', href: '/(tabs)/settings' },
    { title: 'Sync & storage', icon: 'cloud-upload-outline', href: '/sync-queue' },
  ] },
];

function ShopAvatar({ shop, size = 38 }: { shop: Shop | null; size?: number }) {
  const uri = shop?.logo_url || shop?.image_url;
  const initials = (shop?.name || 'XB').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return <View style={[styles.avatar, { width: size, height: size }]}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size }} /> : <Text style={styles.avatarText}>{initials}</Text>}
  </View>;
}

export function BusinessDashboardNavigation() {
  const { currentShop, shops, selectShop } = useShops();
  const { top } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSwitcherOpen, setDrawerSwitcherOpen] = useState(false);

  const openSwitcher = () => setSwitcherOpen(true);
  const closeDrawer = () => { setDrawerOpen(false); setDrawerSwitcherOpen(false); };
  const navigate = (href: Href) => { closeDrawer(); router.push(href); };
  const choose = async (shop: Shop) => {
    await selectShop(shop);
    setSwitcherOpen(false);
    closeDrawer();
  };
  const switcher = (
    <>
      <Text style={styles.switchTitle}>SWITCH WORKSPACE</Text>
      <ScrollView style={{ maxHeight: Math.min(height * 0.42, 320) }} keyboardShouldPersistTaps="handled">
        {shops.map((shop) => {
          const selected = String(shop.id) === String(currentShop?.id);
          return <Pressable key={shop.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => void choose(shop)} style={[styles.shopOption, selected && styles.selected]}>
            <ShopAvatar shop={shop} size={30} />
            <View style={{ flex: 1 }}><Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text><Text style={styles.shopMeta} numberOfLines={1}>{shop.handle ? '@' + shop.handle.replace(/^@/, '') + ' · ' : ''}{shop.seller_access === 'owner' ? 'Owner' : shop.access_level || 'Member'}</Text></View>
            {selected && <Ionicons name="checkmark" size={19} color={palette.primary} />}
          </Pressable>;
        })}
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => { setSwitcherOpen(false); closeDrawer(); router.push('/create-shop'); }} style={styles.newShop}><Ionicons name="add-circle-outline" size={19} color={palette.primary} /><Text style={styles.newShopText}>Create New Shop</Text></Pressable>
    </>
  );

  return <>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open business navigation" onPress={() => { setSwitcherOpen(false); setDrawerOpen(true); }} style={styles.menuButton}><Ionicons name="menu-outline" size={23} color={palette.ink} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" accessibilityState={{ expanded: switcherOpen }} onPress={openSwitcher} style={styles.shopSwitch}>
        <ShopAvatar shop={currentShop} />
        <View style={{ flex: 1 }}><Text style={styles.shopName} numberOfLines={1}>{currentShop?.name || 'Your shop'}</Text><Text style={styles.shopMeta} numberOfLines={1}>{currentShop?.seller_access === 'owner' ? 'Owner' : currentShop?.access_level || 'Workspace'}{currentShop?.handle ? ' · @' + currentShop.handle.replace(/^@/, '') : ''}</Text></View>
        <Ionicons name="chevron-down" size={17} color={palette.muted} />
      </Pressable>
    </View>
    <View style={styles.breadcrumb}><Text style={styles.crumbBrand}>Xonbay Business</Text><Ionicons name="chevron-forward" size={13} color={palette.muted} /><Text style={styles.crumbCurrent}>Overview</Text></View>

    <Modal visible={switcherOpen} transparent statusBarTranslucent animationType="fade" onRequestClose={() => setSwitcherOpen(false)}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close workspace switcher" style={StyleSheet.absoluteFill} onPress={() => setSwitcherOpen(false)} />
        <View style={[styles.switcher, { top: top + 76, width: Math.min(width - 32, 380) }]}>{switcher}</View>
      </View>
    </Modal>

    <Modal visible={drawerOpen} transparent statusBarTranslucent animationType="slide" onRequestClose={closeDrawer}>
      <View style={styles.drawerOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close business navigation" style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        <SafeAreaView edges={['top', 'bottom']} style={[styles.drawer, { width: Math.min(width * 0.87, 320) }]}>
          <View style={styles.drawerHeading}><Text style={styles.drawerTitle}>Xonbay Business</Text><Pressable accessibilityRole="button" accessibilityLabel="Close navigation" onPress={closeDrawer} style={styles.close}><Ionicons name="close" size={21} color={palette.ink} /></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" accessibilityState={{ expanded: drawerSwitcherOpen }} onPress={() => setDrawerSwitcherOpen((open) => !open)} style={styles.drawerShop}><ShopAvatar shop={currentShop} size={34} /><View style={{ flex: 1 }}><Text style={styles.shopName} numberOfLines={1}>{currentShop?.name || 'Your shop'}</Text><Text style={styles.shopMeta} numberOfLines={1}>{currentShop?.seller_access === 'owner' ? 'Owner' : currentShop?.access_level || 'Workspace'}{currentShop?.handle ? ' · @' + currentShop.handle.replace(/^@/, '') : ''}</Text></View><Ionicons name="chevron-down" size={16} color={palette.muted} /></Pressable>
          {drawerSwitcherOpen && <View style={styles.drawerSwitcher}>{switcher}</View>}
          <ScrollView contentContainerStyle={styles.navContent}>
            {groups.map((group) => <View key={group.label} style={styles.group}><Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
              {group.items.map((item) => { const active = item.title === 'Overview'; return <Pressable key={item.title} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => navigate(item.href)} style={[styles.navItem, active && styles.navSelected]}><Ionicons name={item.icon} size={19} color={active ? palette.primary : palette.textSecondary} /><Text style={[styles.navText, active && styles.navTextSelected]}>{item.title}</Text></Pressable>; })}
            </View>)}
          </ScrollView>
          <View style={styles.drawerFoot}><Pressable accessibilityRole="button" onPress={() => navigate('/workspace')} style={styles.navItem}><Ionicons name="storefront-outline" size={19} color={palette.textSecondary} /><Text style={styles.navText}>All shops</Text><Ionicons name="arrow-forward" size={16} color={palette.muted} /></Pressable></View>
        </SafeAreaView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  menuButton: { width: 44, height: 48, borderWidth: 1, borderColor: palette.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  shopSwitch: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: 1, borderColor: palette.border, borderRadius: 11, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: palette.surface },
  avatar: { borderRadius: 9, overflow: 'hidden', backgroundColor: palette.surfaceSoft, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '900', color: palette.primary },
  shopName: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  shopMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 14, marginBottom: 8 },
  crumbBrand: { color: palette.muted, fontSize: 11, fontWeight: '700' }, crumbCurrent: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: palette.overlaySoft, alignItems: 'center' },
  switcher: { position: 'absolute', backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 7, overflow: 'hidden' },
  switchTitle: { color: palette.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, paddingHorizontal: 9, paddingVertical: 10 },
  shopOption: { minHeight: 52, flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 9, borderRadius: 9 },
  selected: { backgroundColor: palette.primaryMuted },
  newShop: { borderTopWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, minHeight: 47 },
  newShopText: { color: palette.primary, fontWeight: '800', fontSize: 12 },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: palette.overlay },
  drawer: { backgroundColor: palette.surface, borderRightWidth: 1, borderRightColor: palette.border },
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
