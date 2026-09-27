import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { money } from '@/lib/api';
import { cachedCollection, operations } from '@/lib/offline';
import type { Product } from '@/lib/types';
import { useShops } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { Card, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

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
    <Heading eyebrow="INVENTORY" title="Products" subtitle={currentShop ? 'Listings and stock for ' + currentShop.name : 'Choose a shop to see its products.'} />
    {currentShop && <PrimaryButton title="Add product" onPress={() => router.push('/create-product')} />}
    {currentShop && <Pressable onPress={() => router.push('/events')}><Text style={{ color: palette.blue, fontWeight: '700', marginBottom: 18, marginTop: 10 }}>Manage events →</Text></Pressable>}
    {cached && <Text style={{ color: palette.muted, marginBottom: 12 }}>Showing saved products. Prices and stock may have changed online.</Text>}
    {shopsLoading && <ActivityIndicator />}
    {!shopsLoading && !currentShop && <StateMessage text="Create or select a shop from Home or Settings to see products." />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {loading && !products.length && <ActivityIndicator />}
    {!loading && !error && currentShop && !products.length && <StateMessage text="No products yet. Add your first listing above." />}
    {products.map((product) => <Card key={product.id}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16, flex: 1 }}>{product.name}</Text>
        <Text style={{ color: palette.blue, fontWeight: '800' }}>{product.price === undefined ? '—' : money(Number(product.price))}</Text>
      </View>
      <Text style={{ color: palette.muted, marginTop: 8 }}>{product.active === false ? 'Inactive' : 'Active'} · {product.quantity ?? 0} in stock</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 }}>
        <Text style={{ color: palette.ink, fontWeight: '700', flex: 1 }}>Adjust stock</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Decrease ' + product.name + ' stock'} disabled={updating !== null || !(Number(product.quantity) > 0)} onPress={() => changeStock(product, -1)}><Text style={{ color: palette.blue, fontWeight: '900', fontSize: 25 }}>−</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Increase ' + product.name + ' stock'} disabled={updating !== null} onPress={() => changeStock(product, 1)}><Text style={{ color: palette.blue, fontWeight: '900', fontSize: 25 }}>+</Text></Pressable>
      </View>
    </Card>)}
  </Page>;
}
