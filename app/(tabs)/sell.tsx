import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { useSync } from '@/context/SyncContext';
import { cachedCollection } from '@/lib/offline';
import { money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Card, Field, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

export default function SellScreen() {
  const { user } = useAuth();
  const { currentShop } = useShops();
  const { queue } = useSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const load = useCallback(async () => {
    if (!currentShop || !user) { setProducts([]); return; }
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
  const total = picked.reduce((sum, product) => sum + Number(product.price || 0) * quantities[product.id], 0);
  const recordSale = () => {
    if (!currentShop || !picked.length) return;
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
  return <Page>
    <Heading eyebrow="POINT OF SALE" title="Record a sale" subtitle={currentShop ? 'Cash · ' + currentShop.name : 'Select a shop first.'} />
    <Card><Text style={{ color: palette.muted }}>Cash sales can be saved without internet. Online pricing and stock are checked again during sync. Card and MoMo collection require an online payment flow.</Text></Card>
    {cached && <Text style={{ color: palette.muted, marginBottom: 12 }}>Using a saved catalog. Confirm current prices with the customer.</Text>}
    {loading && <ActivityIndicator />}
    {error && <StateMessage text={error} onRetry={() => void load()} />}
    {!loading && !error && !products.length && <StateMessage text="No eligible products. Sync an active product without variants to record a sale." />}
    {products.map((product) => <Card key={product.id}>
      <Text style={{ color: palette.ink, fontWeight: '800' }}>{product.name} · {money(Number(product.price || 0))}</Text>
      <Text style={{ color: palette.muted, marginTop: 5 }}>{product.quantity ?? 0} in the last saved stock count</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + product.name} onPress={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.max(0, (previous[product.id] || 0) - 1) }))}><Text style={{ color: palette.blue, fontSize: 25 }}>−</Text></Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700' }}>{quantities[product.id] || 0}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Add ' + product.name} onPress={() => setQuantities((previous) => ({ ...previous, [product.id]: Math.min(999, (previous[product.id] || 0) + 1) }))}><Text style={{ color: palette.blue, fontSize: 25 }}>+</Text></Pressable>
      </View>
    </Card>)}
    <Field label="Customer name (optional)" value={customer} onChangeText={setCustomer} />
    <Text style={{ color: palette.ink, fontWeight: '900', fontSize: 22 }}>Total {money(total)}</Text>
    <PrimaryButton title="Record cash sale" loading={saving} disabled={!currentShop || !picked.length} onPress={recordSale} />
  </Page>;
}
