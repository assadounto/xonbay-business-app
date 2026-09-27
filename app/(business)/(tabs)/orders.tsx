import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, money } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/lib/types';
import { canAccess } from '@/lib/business-navigation';
import { BusinessAccessDenied } from '@/components/BusinessAccessDenied';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function OrdersScreen() {
  const { currentShop, loading: shopsLoading } = useShops();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const load = useCallback(async (nextPage = 1) => {
    if (!currentShop || !user || !canAccess(currentShop, 'orders_management')) { setOrders([]); return; }
    if (nextPage === 1) setOrders([]);
    setLoading(true); setError('');
    try {
      const result = await cachedRequest(user.id, currentShop.id, 'orders:' + nextPage, () =>
        api<{ data?: Order[]; meta?: { total?: number } }>('/shops/' + currentShop.id + '/orders?page=' + nextPage + '&per_page=20'));
      setOrders((previous) => nextPage === 1 ? result.value.data || [] : [...previous, ...(result.value.data || [])]);
      setTotal(result.value.meta?.total || 0);
      setCached(result.offline);
      setPage(nextPage);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load orders'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);
  useFocusEffect(useCallback(() => { void load(1); }, [load]));

  if (currentShop && !canAccess(currentShop, 'orders_management')) return <BusinessAccessDenied />;
  return <Page>
    <Heading eyebrow="YOUR WORKSPACE / ORDERS" title="Orders" subtitle={currentShop ? 'Keep track of every order for ' + currentShop.name : 'Choose a shop to see its orders.'} />
    {cached && <StatusPill label="Saved orders · reconnect for updates" tone="warning" />}
    {currentShop && <SectionTitle title="Recent orders" caption={total + ' total'} action="Refresh" onPress={() => void load(1)} />}
    {shopsLoading && <ActivityIndicator />}
    {!shopsLoading && !currentShop && <StateMessage text="Create or select a shop from Home or Settings to see orders." />}
    {error && <StateMessage text={error} onRetry={() => void load(page)} />}
    {loading && !orders.length && <ActivityIndicator />}
    {!loading && !error && currentShop && !orders.length && <Card><View style={{ alignItems: 'center', paddingVertical: 18 }}><Ionicons name="receipt-outline" size={32} color={palette.primary} /><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '900', marginTop: 12 }}>No orders yet</Text><Text style={{ color: palette.muted, marginTop: 6, textAlign: 'center' }}>New customer orders will appear here.</Text></View></Card>}
    {orders.map((order) => {
      const customer = typeof order.customer === 'string' ? order.customer : order.customer?.name;
      const totalGhs = order.total_ghs ?? (order.amount_pesewas !== undefined ? order.amount_pesewas / 100 : undefined);
      const fulfillment = order.fulfillment_status || 'Placed';
      const tone = ['delivered', 'completed', 'picked_up'].includes(fulfillment.toLowerCase()) ? 'good' : ['cancelled', 'returned'].includes(fulfillment.toLowerCase()) ? 'warning' : 'neutral';
      return <Card key={String(order.id)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '800', flex: 1 }}>ORDER {order.order_number || '#' + order.id}</Text>
          <StatusPill label={fulfillment.replace(/_/g, ' ')} tone={tone} />
        </View>
        <Text style={{ color: palette.ink, fontWeight: '900', fontSize: 22, marginTop: 13 }}>{totalGhs === undefined ? 'Amount unavailable' : money(totalGhs, order.currency || 'GHS')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 }}><Ionicons name="person-circle-outline" color={palette.muted} size={17} /><Text style={{ color: palette.muted, flex: 1 }} numberOfLines={1}>{customer || 'Customer'}</Text></View>
        <View style={{ flexDirection: 'row', marginTop: 9, gap: 10 }}>
          <Text style={{ color: palette.muted, fontSize: 12 }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date unavailable'}</Text>
          {!!order.order_items?.length && <Text style={{ color: palette.muted, fontSize: 12 }}>· {order.order_items.length} item{order.order_items.length === 1 ? '' : 's'}</Text>}
          <Text style={{ color: palette.muted, fontSize: 12 }}>· {order.status || 'Pending payment'}</Text>
        </View>
      </Card>;
    })}
    {orders.length < total && <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load(page + 1)} style={{ padding: 16, alignItems: 'center' }}><Text style={{ color: palette.primary, fontWeight: '800' }}>{loading ? 'Loading…' : 'Load more orders'}</Text></Pressable>}
  </Page>;
}
