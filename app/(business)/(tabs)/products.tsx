import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { money } from '@/lib/api';
import { cachedCollection, operations } from '@/lib/offline';
import type { Product } from '@/lib/types';
import { useShops } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { Card, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function ProductsScreen() {
  const { currentShop, loading: shopsLoading } = useShops();
  const { user } = useAuth();
  const { queue } = useSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!currentShop || !user) { setProducts([]); return; }
    setProducts([]);
    setLoading(true); setError('');
    try {
      const result = await cachedCollection<Product>(user.id, currentShop.id, 'products',
        (page) => '/users_shop_products?shop_id=' + currentShop.id + '&page=' + page + '&per_page=100',
        (response) => response.shop_products || response.items || []);
      setProducts(result.value);
      setCached(result.offline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load products'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const changeStock = (product: Product, amount: number) => {
    const next = Math.max(0, (Number(product.quantity) || 0) + amount);
    Alert.alert('Update stock', 'Set ' + product.name + ' stock to ' + next + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        if (!currentShop || !user) return;
        setUpdating(product.id);
        try {
          const pending = (await operations(user.id, currentShop.id)).some((row) => row.kind === 'stock' && JSON.parse(row.payload).shop_product_id === product.id);
          if (pending) { Alert.alert('Stock already waiting', 'Review the existing stock change in Sync before making another.'); return; }
          await queue(currentShop.id, 'stock', { shop_product_id: product.id, expected_quantity: Number(product.quantity) || 0, quantity: next });
          Alert.alert('Saved on this device', 'The stock change will sync when online.');
        } catch (cause) { Alert.alert('Could not update stock', cause instanceof Error ? cause.message : 'Please try again.'); }
        finally { setUpdating(null); }
      } },
    ]);
  };

  return <Page>
    <Heading eyebrow="YOUR WORKSPACE / CATALOG" title="Products" subtitle={currentShop ? 'Listings and inventory for ' + currentShop.name : 'Choose a shop to see its products.'} />
    {currentShop && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <View style={{ flex: 1 }}><PrimaryButton title="Add product" onPress={() => router.push('/create-product')} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Manage events" onPress={() => router.push('/events')} style={{ height: 52, width: 52, borderRadius: 14, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}><Ionicons name="calendar-outline" color={palette.primary} size={23} /></Pressable>
    </View>}
    {cached && <StatusPill label="Saved catalog · stock may have changed" tone="warning" />}
    {currentShop && <SectionTitle title="Your catalog" caption={products.length + ' products'} action="Refresh" onPress={() => void load()} />}
    {shopsLoading && <ActivityIndicator />}
    {!shopsLoading && !currentShop && <StateMessage text="Create or select a shop from Home or Settings to see products." />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {loading && !products.length && <ActivityIndicator />}
    {!loading && !error && currentShop && !products.length && <StateMessage text="No products yet. Add your first listing above." />}
    {products.map((product) => <Card key={product.id}>
      <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
        {!cached && typeof product.image_url === 'string' && product.image_url ? <Image source={{ uri: product.image_url }} style={{ height: 54, width: 54, borderRadius: 12, backgroundColor: palette.primaryMuted }} /> : <View style={{ height: 54, width: 54, borderRadius: 12, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="cube-outline" color={palette.primary} size={22} /></View>}
        <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '900', fontSize: 15 }} numberOfLines={2}>{product.name}</Text><Text style={{ color: palette.primary, fontWeight: '900', marginTop: 5 }}>{product.price === undefined ? 'Price unavailable' : money(Number(product.price))}</Text></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 }}><StatusPill label={product.active === false ? 'Draft' : 'Active'} tone={product.active === false ? 'warning' : 'good'} /><Text style={{ color: palette.muted, fontSize: 12, fontWeight: '700' }}>{product.quantity ?? 0} in stock</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Text style={{ color: palette.ink, fontWeight: '700', flex: 1 }}>Adjust stock</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Decrease ' + product.name + ' stock'} disabled={updating !== null || !(Number(product.quantity) > 0)} onPress={() => changeStock(product, -1)} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" color={palette.primary} size={19} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Increase ' + product.name + ' stock'} disabled={updating !== null} onPress={() => changeStock(product, 1)} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" color={palette.primary} size={19} /></Pressable>
      </View>
    </Card>)}
  </Page>;
}
