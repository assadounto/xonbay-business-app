import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { api, money } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, StateMessage } from '@/components/ui';

export default function OrdersScreen() {
  const { currentShop, loading: shopsLoading } = useShops();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (nextPage = 1) => {
    if (!currentShop) { setOrders([]); return; }
    setLoading(true); setError('');
    try {
      const result = await api<{ data?: Order[]; meta?: { total?: number } }>('/shops/' + currentShop.id + '/orders?page=' + nextPage + '&per_page=20');
      setOrders((previous) => nextPage === 1 ? result.data || [] : [...previous, ...(result.data || [])]);
      setTotal(result.meta?.total || 0);
      setPage(nextPage);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load orders'); }
    finally { setLoading(false); }
  }, [currentShop?.id]);
  useFocusEffect(useCallback(() => { void load(1); }, [load]));

  return <Page>
    <Heading eyebrow="ORDERS" title="Your orders" subtitle={currentShop ? currentShop.name + ' · ' + total + ' total' : 'Choose a shop to see its orders.'} />
    {shopsLoading && <ActivityIndicator />}
    {!shopsLoading && !currentShop && <StateMessage text="Create or select a shop from Home or Settings to see orders." />}
    {error && <StateMessage text={error} onRetry={() => void load(page)} />}
    {loading && !orders.length && <ActivityIndicator />}
    {!loading && !error && currentShop && !orders.length && <StateMessage text="No orders yet. New customer orders will appear here." />}
    {orders.map((order) => {
      const customer = typeof order.customer === 'string' ? order.customer : order.customer?.name;
      const totalGhs = order.total_ghs ?? (order.amount_pesewas !== undefined ? order.amount_pesewas / 100 : undefined);
      return <Card key={String(order.id)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800', flex: 1 }}>Order {order.order_number || '#' + order.id}</Text>
          <Text style={{ color: palette.blue, fontWeight: '800' }}>{totalGhs === undefined ? '—' : money(totalGhs, order.currency || 'GHS')}</Text>
        </View>
        <Text style={{ color: palette.muted, marginTop: 8 }}>{customer || 'Customer'}{order.created_at ? ' · ' + new Date(order.created_at).toLocaleDateString() : ''}</Text>
        <Text style={{ color: palette.ink, fontWeight: '700', marginTop: 10 }}>Status: {order.fulfillment_status || order.status || 'Pending'}</Text>
        {!!order.order_items?.length && <Text style={{ color: palette.muted, marginTop: 4 }}>{order.order_items.length} item{order.order_items.length === 1 ? '' : 's'}</Text>}
      </Card>;
    })}
    {orders.length < total && <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load(page + 1)} style={{ padding: 16, alignItems: 'center' }}><Text style={{ color: palette.blue, fontWeight: '800' }}>{loading ? 'Loading…' : 'Load more orders'}</Text></Pressable>}
  </Page>;
}
