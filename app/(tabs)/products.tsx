import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { api, money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, StateMessage } from '@/components/ui';

export default function ProductsScreen() {
  const { currentShop, loading: shopsLoading } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage = 1) => {
    if (!currentShop) { setProducts([]); return; }
    setLoading(true); setError('');
    try {
      const result = await api<{ shop_products?: Product[]; items?: Product[]; meta?: { total_pages?: number; current_page?: number } }>('/users_shop_products?shop_id=' + currentShop.id + '&page=' + nextPage + '&per_page=20');
      const items = result.shop_products || result.items || [];
      setProducts((previous) => nextPage === 1 ? items : [...previous, ...items]);
      setPage(result.meta?.current_page || nextPage);
      setLastPage(result.meta?.total_pages || nextPage);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load products'); }
    finally { setLoading(false); }
  }, [currentShop?.id]);
  useFocusEffect(useCallback(() => { void load(1); }, [load]));

  const changeStock = (product: Product, amount: number) => {
    const next = Math.max(0, (Number(product.quantity) || 0) + amount);
    Alert.alert('Update stock', 'Set ' + product.name + ' stock to ' + next + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        if (!currentShop) return;
        setUpdating(product.id);
        try {
          await api('/shops/' + currentShop.id + '/inventory/update_stock', {
            method: 'POST', body: JSON.stringify({ shop_product_id: product.id, quantity: next }),
          });
          setProducts((previous) => previous.map((item) => item.id === product.id ? { ...item, quantity: next } : item));
        } catch (cause) { Alert.alert('Could not update stock', cause instanceof Error ? cause.message : 'Please try again.'); }
        finally { setUpdating(null); }
      } },
    ]);
  };

  return <Page>
    <Heading eyebrow="INVENTORY" title="Products" subtitle={currentShop ? 'Listings and stock for ' + currentShop.name : 'Choose a shop to see its products.'} />
    {shopsLoading && <ActivityIndicator />}
    {!shopsLoading && !currentShop && <StateMessage text="Create or select a shop from Home or Settings to see products." />}
    {error && <StateMessage text={error} onRetry={() => void load(page)} />}
    {loading && !products.length && <ActivityIndicator />}
    {!loading && !error && currentShop && !products.length && <StateMessage text="No products yet. Add a listing from your Xonbay seller dashboard." />}
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
    {page < lastPage && <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load(page + 1)} style={{ padding: 16, alignItems: 'center' }}><Text style={{ color: palette.blue, fontWeight: '800' }}>{loading ? 'Loading…' : 'Load more products'}</Text></Pressable>}
  </Page>;
}
