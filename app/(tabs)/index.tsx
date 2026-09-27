import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { api, money } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import type { Dashboard } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { shops, currentShop, loading: shopsLoading, error: shopsError, refresh } = useShops();
  const [report, setReport] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!currentShop || !user) { setReport(null); return; }
    setLoading(true); setError('');
    try {
      const { value } = await cachedRequest(user.id, currentShop.id, 'dashboard', () => api<Dashboard>('/user_shops/' + currentShop.id + '/dashboard'));
      setReport(value);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load dashboard'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useFocusEffect(useCallback(() => { void loadReport(); }, [loadReport]));

  const currency = report?.kpis?.revenue?.currency || 'GHS';
  return (
    <Page>
      <Heading eyebrow="XONBAY BUSINESS" title={currentShop?.name || 'Your workspace'} subtitle={'Hello' + (user?.name ? ', ' + user.name : '') + '. Keep your business moving.'} />
      {shopsLoading && <ActivityIndicator />}
      {shopsError && <StateMessage text={shopsError} onRetry={() => void refresh()} />}
      {!shopsLoading && !shopsError && !currentShop && (
        <Card><Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800' }}>Start your first shop</Text><Text style={{ color: palette.muted, marginTop: 8 }}>Set up a shop to see sales, orders and inventory here.</Text><PrimaryButton title="Create a shop" onPress={() => router.push('/create-shop')} /></Card>
      )}
      {currentShop && <>
        {error && <StateMessage text={error} onRetry={() => void loadReport()} />}
        {loading && !report && <ActivityIndicator />}
        <View style={{ backgroundColor: palette.blue, borderRadius: 20, padding: 22, marginBottom: 15 }}>
          <Text style={{ color: '#BFDBFE', fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>TODAY'S SALES</Text>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 32, marginTop: 10 }}>{money(report?.kpis?.revenue?.today_ghs || 0, currency)}</Text>
          <Text style={{ color: '#BFDBFE', marginTop: 6 }}>Recorded sales for {currentShop.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Card><Text style={{ color: palette.muted }}>This week</Text><Text style={{ fontSize: 17, fontWeight: '800', marginTop: 8 }}>{money(report?.kpis?.revenue?.week_ghs || 0, currency)}</Text></Card></View>
          <View style={{ flex: 1 }}><Card><Text style={{ color: palette.muted }}>This month</Text><Text style={{ fontSize: 17, fontWeight: '800', marginTop: 8 }}>{money(report?.kpis?.revenue?.month_ghs || 0, currency)}</Text></Card></View>
        </View>
        <Card><Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16 }}>Orders to handle</Text><Text style={{ marginTop: 8, color: palette.muted }}>{report?.orders?.new || 0} new · {report?.orders?.processing || 0} processing</Text></Card>
        <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 12, color: palette.ink }}>Quick actions</Text>
        <Card>
          <QuickAction title="Review orders" icon="receipt-outline" onPress={() => router.push('/(tabs)/orders')} />
          <QuickAction title="Manage products" icon="cube-outline" onPress={() => router.push('/(tabs)/products')} />
          <QuickAction title="Manage events" icon="calendar-outline" onPress={() => router.push('/events')} />
          <QuickAction title="Record a sale" icon="cash-outline" onPress={() => router.push('/(tabs)/sell')} />
          <QuickAction title="Switch shop" icon="swap-horizontal-outline" onPress={() => router.push('/(tabs)/settings')} />
        </Card>
        <Heading title="Low stock" />
        <Card>{report?.low_stock?.length ? report.low_stock.slice(0, 5).map((item) => <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }}><Text style={{ flex: 1 }}>{item.name}</Text><Text style={{ color: '#B45309' }}>{item.left} left</Text></View>) : <Text style={{ color: palette.muted }}>No low stock items reported.</Text>}</Card>
      </>}
    </Page>
  );
}
function QuickAction({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}><Ionicons name={icon} color={palette.blue} size={20} /><Text style={{ flex: 1, marginLeft: 12, color: palette.ink, fontWeight: '700' }}>{title}</Text><Ionicons name="chevron-forward" color={palette.muted} size={16} /></Pressable>;
}
