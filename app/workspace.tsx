import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';
import type { Shop } from '@/lib/types';
import { money } from '@/lib/api';

export default function WorkspaceScreen() {
  const { user, loaded } = useAuth();
  const { shops, currentShop, selectShop, refresh, loading, error } = useShops();
  const [query, setQuery] = useState('');
  const [opening, setOpening] = useState<number | null>(null);
  useFocusEffect(useCallback(() => { if (user) void refresh(); }, [user?.id, refresh]));
  const results = useMemo(() => shops.filter((shop) => [shop.name, shop.handle, shop.city, shop.region,
    typeof shop.category === 'string' ? shop.category : shop.category?.name].filter(Boolean).some((field) => String(field).toLowerCase().includes(query.trim().toLowerCase()))), [shops, query]);
  if (!loaded) return <View style={styles.loading}><ActivityIndicator color={palette.blue} /></View>;
  if (!user) return <Redirect href="/login" />;
  const owners = shops.filter((shop) => shop.seller_access === 'owner').length;
  return <Page>
    <View style={styles.header}>
      <View style={styles.brand}><Text style={styles.brandText}>X</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.brandEyebrow}>XONBAY BUSINESS</Text><Text style={styles.brandTitle}>Your workspace</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh shops" onPress={() => void refresh()} style={styles.refresh}><Ionicons name="refresh" size={19} color={palette.ink} /></Pressable>
    </View>
    <Heading eyebrow="BUSINESS WORKSPACES" title="Your shops, in one place." subtitle="Choose a shop to manage products, orders and sales. Your saved shop data stays available offline." />
    <PrimaryButton title="+  Create new shop" onPress={() => router.push('/create-shop')} />
    {loading && !shops.length && <ActivityIndicator style={{ marginVertical: 35 }} color={palette.blue} />}
    {error && <StateMessage text={error} onRetry={() => void refresh()} />}
    {shops.length > 0 && <>
      <View style={styles.summaryRow}>
        <Summary icon="storefront-outline" value={shops.length} label="Workspaces" />
        <Summary icon="checkmark-circle-outline" value={owners} label="Owned shops" />
        <Summary icon="people-outline" value={shops.length - owners} label="Member access" />
      </View>
      <SectionTitle title="Your shops" caption="Open a shop to pick up where you left off" />
      <View style={styles.search}><Ionicons name="search-outline" size={18} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, handle or location" placeholderTextColor="#94A3B8" style={styles.input} autoCorrect={false} /></View>
      {results.map((shop) => <ShopCard key={shop.id} shop={shop} active={shop.id === currentShop?.id} busy={opening === shop.id} onOpen={async () => {
        setOpening(shop.id);
        try { await selectShop(shop); router.push('/(tabs)'); }
        finally { setOpening(null); }
      }} />)}
      {!results.length && <Card><View style={styles.empty}><Ionicons name="search" color={palette.muted} size={25} /><Text style={styles.emptyTitle}>No matching shop</Text><Text style={styles.hint}>Try another shop name, category or location.</Text></View></Card>}
    </>}
    {!loading && !error && !shops.length && <Card><View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="storefront-outline" color={palette.blue} size={26} /></View><Text style={styles.emptyTitle}>Create your first shop</Text><Text style={styles.hint}>Build your storefront, add products and run your Xonbay business from one workspace.</Text><PrimaryButton title="Create shop" onPress={() => router.push('/create-shop')} /></View></Card>}
  </Page>;
}

function Summary({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  return <View style={styles.summary}><Ionicons name={icon} size={19} color={palette.blue} /><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}
function ShopCard({ shop, active, busy, onOpen }: { shop: Shop; active: boolean; busy: boolean; onOpen: () => void }) {
  const logo = shop.logo_url || shop.image_url;
  const category = typeof shop.category === 'string' ? shop.category : shop.category?.name;
  const available = shop.wallet_preview?.available_pesewas;
  const products = shop.products_count ?? shop.stats?.products;
  return <Card>
    <View style={styles.shopTop}>
      <View style={styles.logo}>{logo ? <Image source={{ uri: logo }} style={styles.logoImage} /> : <Text style={styles.initials}>{shop.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</Text>}</View>
      <View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>{(shop.verified || shop.is_verified) && <Ionicons name="checkmark-circle" size={17} color={palette.blue} />}</View>
        <Text style={styles.hint} numberOfLines={1}>{shop.handle ? '@' + shop.handle.replace(/^@/, '') : 'Shop workspace'}{shop.city ? ' · ' + shop.city : ''}</Text>
        <View style={styles.pills}><StatusPill label={shop.seller_access === 'owner' ? 'Owner' : shop.access_level || 'Member'} tone={shop.seller_access === 'owner' ? 'good' : 'warning'} />{category ? <StatusPill label={category} /> : null}{active && <StatusPill label="Current" />}</View>
      </View>
    </View>
    <View style={styles.meta}><View style={{ flex: 1 }}><Text style={styles.metaValue}>{products == null ? '—' : products}</Text><Text style={styles.metaLabel}>PRODUCTS</Text></View><View style={styles.metaDivider} /><View style={{ flex: 1, paddingLeft: 14 }}><Text style={styles.metaValue} numberOfLines={1} adjustsFontSizeToFit>{shop.seller_access === 'owner' && available != null ? money(available / 100, shop.wallet_preview?.currency || 'GHS') : shop.seller_access === 'owner' ? '—' : shop.access_level || 'Member'}</Text><Text style={styles.metaLabel}>{shop.seller_access === 'owner' ? 'AVAILABLE' : 'ACCESS LEVEL'}</Text></View></View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={onOpen} style={styles.open}><Text style={styles.openText}>{busy ? 'Opening…' : 'Open dashboard'}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable>
  </Card>;
}
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 28 },
  brand: { width: 42, height: 42, borderRadius: 13, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontWeight: '900', color: '#fff', fontSize: 25 },
  brandEyebrow: { color: palette.blue, fontWeight: '900', fontSize: 10, letterSpacing: 1.3 },
  brandTitle: { color: palette.ink, fontWeight: '900', fontSize: 16, marginTop: 2 },
  refresh: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  summary: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white, borderRadius: 15, padding: 10, gap: 5 },
  summaryValue: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  summaryLabel: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 13, paddingHorizontal: 14, marginBottom: 15 },
  input: { flex: 1, minHeight: 48, color: palette.ink, fontSize: 13 },
  shopTop: { flexDirection: 'row', gap: 13 },
  logo: { width: 57, height: 57, overflow: 'hidden', borderRadius: 15, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 57, height: 57 }, initials: { fontSize: 19, fontWeight: '900', color: palette.blue },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopName: { color: palette.ink, fontSize: 16, fontWeight: '900', flexShrink: 1 },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 4 },
  pills: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 10 },
  meta: { flexDirection: 'row', marginTop: 18, padding: 13, backgroundColor: palette.background, borderRadius: 12, alignItems: 'center' },
  metaDivider: { width: 1, height: 33, backgroundColor: palette.border },
  metaValue: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  metaLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginTop: 4 },
  open: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.blue, borderRadius: 12, minHeight: 45, marginTop: 14 },
  openText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { height: 58, width: 58, borderRadius: 17, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: palette.ink, fontSize: 18, fontWeight: '900', marginTop: 7 },
});
