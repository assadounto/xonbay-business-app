import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { useSync } from '@/context/SyncContext';
import { cachedCollection } from '@/lib/offline';
import { money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { canAccess } from '@/lib/business-navigation';
import { BusinessAccessDenied } from '@/components/BusinessAccessDenied';
import { Card, Field, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function SellScreen() {
  const { user } = useAuth();
  const { currentShop } = useShops();
  const { queue } = useSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customer, setCustomer] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const load = useCallback(async () => {
    if (!currentShop || !user || !canAccess(currentShop, 'orders_management')) { setProducts([]); return; }
    setProducts([]); setQuantities({}); setLoading(true); setError('');
    try {
      const result = await cachedCollection<Product>(user.id, currentShop.id, 'products',
        (page) => '/users_shop_products?shop_id=' + currentShop.id + '&page=' + page + '&per_page=100',
        (response) => response.shop_products || response.items || []);
      setProducts(result.value.filter((product) => product.active !== false && !['ticket', 'listing'].includes(product.kind || '') && !product.variations?.length));
      setCached(result.offline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the catalog'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const picked = products.filter((product) => quantities[product.id] > 0);
  const visible = products.filter((product) => product.name.toLowerCase().includes(query.trim().toLowerCase()));
  const total = picked.reduce((sum, product) => sum + Number(product.price || 0) * quantities[product.id], 0);
  const recordSale = () => {
    if (!currentShop || !canAccess(currentShop, 'orders_management') || !picked.length) return;
    Alert.alert('Record cash sale', 'Confirm you collected ' + money(total) + ' in cash. This sale is saved on this device and sent to Xonbay when online. Stock may have changed since the catalog was saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save sale', onPress: async () => {
        setSaving(true);
        try {
          await queue(currentShop.id, 'sale', {
            payment_method: 'cash', payment_status: 'paid', delivery_method: 'pickup',
            sales_channel: 'walk_in', fulfilled: true, customer: { name: customer.trim() || 'Walk-in customer' },
            items: picked.map((product) => ({ shop_product_id: product.id, quantity: quantities[product.id] })),
          });
          setQuantities({}); setCustomer('');
          Alert.alert('Sale saved', 'Check Sync for the server result. A sale is complete online only when it disappears from the queue.');
        } catch (cause) { Alert.alert('Could not save sale', cause instanceof Error ? cause.message : 'Try again.'); }
        finally { setSaving(false); }
      } },
    ]);
  };
  if (currentShop && !canAccess(currentShop, 'orders_management')) return <BusinessAccessDenied />;
  return <Page footer={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <View style={{ flex: 1 }}><Text style={{ color: palette.muted, fontSize: 11, fontWeight: '800' }}>{picked.length} SELECTED</Text><Text style={{ color: palette.ink, fontWeight: '900', fontSize: 20, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{money(total)}</Text></View>
    <View style={{ flex: 1.2 }}><PrimaryButton title="Save cash sale" loading={saving} disabled={!currentShop || !picked.length} onPress={recordSale} /></View>
  </View>}>
    <Heading eyebrow="POINT OF SALE" title="Record a sale" subtitle={currentShop ? 'Cash sales · ' + currentShop.name : 'Select a shop first.'} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.primaryMuted, borderRadius: 17, padding: 14, marginBottom: 16 }}>
      <Ionicons name="cloud-offline-outline" size={22} color={palette.primary} />
      <Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18, flex: 1 }}>Sales save on this device first. Xonbay confirms stock and price when they sync.</Text>
    </View>
    {cached && <StatusPill label="Saved catalog · confirm prices with your customer" tone="warning" />}
    <SectionTitle title="Select products" caption={products.length + ' available'} />
    <Field label="Search catalog" value={query} onChangeText={setQuery} placeholder="Search by product name" />
    {loading && <ActivityIndicator />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {!loading && !error && !products.length && <StateMessage text="No eligible products. Sync an active product without variants to record a sale." />}
    {!!query && !visible.length && <StateMessage text="No products match your search." />}
    {visible.map((product) => <Card key={product.id}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="cube-outline" size={20} color={palette.primary} /></View>
        <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '900' }} numberOfLines={2}>{product.name}</Text><Text style={{ color: palette.primary, fontWeight: '800', marginTop: 4 }}>{money(Number(product.price || 0))}</Text></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 14 }}>
        <Text style={{ color: palette.muted, fontSize: 12, flex: 1 }}>{product.quantity ?? 0} in last stock count</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + product.name} onPress={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.max(0, (previous[product.id] || 0) - 1) }))} style={{ width: 35, height: 35, borderRadius: 11, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" color={palette.primary} size={18} /></Pressable>
        <Text style={{ fontSize: 16, fontWeight: '900', color: palette.ink, minWidth: 18, textAlign: 'center' }}>{quantities[product.id] || 0}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Add ' + product.name} onPress={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.min(999, (previous[product.id] || 0) + 1) }))} style={{ width: 35, height: 35, borderRadius: 11, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" color={palette.primary} size={18} /></Pressable>
      </View>
    </Card>)}
    <SectionTitle title="Customer" caption="Optional for walk-in sales" />
    <Field label="Customer name (optional)" value={customer} onChangeText={setCustomer} />
    <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>Cash only. Card and MoMo payments require the online checkout.</Text>
  </Page>;
}
