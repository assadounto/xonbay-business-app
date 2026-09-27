import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, money } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import type { Dashboard } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { currentShop, loading: shopsLoading, error: shopsError, refresh } = useShops();
  const [report, setReport] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!currentShop || !user) { setReport(null); return; }
    setLoading(true); setError(''); setReport(null);
    try {
      const result = await cachedRequest(user.id, currentShop.id, 'dashboard', () => api<Dashboard>('/user_shops/' + currentShop.id + '/dashboard'));
      setReport(result.value);
      setCached(result.offline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load dashboard'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useFocusEffect(useCallback(() => { void loadReport(); }, [loadReport]));

  const currency = report?.kpis?.revenue?.currency || 'GHS';
  const series = report?.series?.sales_7d_ghs || [];
  const maxSale = Math.max(...series, 1);
  return <Page>
    <View style={styles.topRow}>
      <View style={styles.mark}><Text style={styles.markText}>X</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.overline}>XONBAY BUSINESS</Text>
        <Text style={styles.workspaceName} numberOfLines={1}>{currentShop?.name || 'Your workspace'}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Switch shop" onPress={() => router.push('/(tabs)/settings')} style={styles.roundButton}>
        <Ionicons name="swap-horizontal-outline" size={20} color={palette.ink} />
      </Pressable>
    </View>
    <Heading title={user?.name ? 'Good to see you, ' + user.name.split(' ')[0] : 'Your day at a glance'} subtitle="Your shop, all in one place." />
    {shopsLoading && !currentShop && <ActivityIndicator />}
    {shopsError && <StateMessage text={shopsError} onRetry={() => void refresh()} />}
    {!shopsLoading && !shopsError && !currentShop && <Card>
      <View style={styles.emptyIcon}><Ionicons name="storefront-outline" size={26} color={palette.blue} /></View>
      <Text style={styles.emptyTitle}>Make this space yours</Text>
      <Text style={styles.emptyDescription}>Create a shop to manage your catalog, orders, events and sales.</Text>
      <PrimaryButton title="Create your first shop" onPress={() => router.push('/create-shop')} />
    </Card>}
    {currentShop && <>
      {loading && <ActivityIndicator style={{ marginVertical: 30 }} />}
      {error && <StateMessage text={error} onRetry={() => void loadReport()} />}
      {report && <>
        {cached && <View style={{ marginBottom: 12 }}><StatusPill label="Saved snapshot · may be out of date" tone="warning" /></View>}
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.heroTop}><Text style={styles.heroLabel}>TODAY'S REVENUE</Text><Ionicons name="trending-up-outline" size={20} color="#CCD1FF" /></View>
          <Text style={styles.heroAmount} adjustsFontSizeToFit numberOfLines={1}>{money(report.kpis?.revenue?.today_ghs || 0, currency)}</Text>
          <Text style={styles.heroDetail}>Sales recorded for {currentShop.name}</Text>
          <View style={styles.chartRow} accessible accessibilityLabel="Sales for the last seven days">
            {(series.length ? series.slice(-7) : Array(7).fill(0)).map((value, index) => <View key={index} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: 12 + 40 * (Number(value) / maxSale), opacity: index === 6 ? 1 : 0.45 }]} />
            </View>)}
          </View>
          <Text style={styles.chartCaption}>LAST 7 DAYS</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={{ flex: 1 }}><MetricCard icon="calendar-outline" title="This week" amount={money(report.kpis?.revenue?.week_ghs || 0, currency)} /></View>
          <View style={{ flex: 1 }}><MetricCard icon="bar-chart-outline" title="This month" amount={money(report.kpis?.revenue?.month_ghs || 0, currency)} /></View>
        </View>

        <SectionTitle title="Orders to handle" action="View all" onPress={() => router.push('/(tabs)/orders')} />
        <Card><View style={styles.orderRow}>
          <View style={{ flex: 1 }}><Text style={styles.orderCount}>{report.orders?.new || 0}</Text><Text style={styles.orderLabel}>New orders</Text></View>
          <View style={styles.divider} />
          <View style={{ flex: 1, paddingLeft: 22 }}><Text style={styles.orderCount}>{report.orders?.processing || 0}</Text><Text style={styles.orderLabel}>Processing</Text></View>
        </View></Card>

        <SectionTitle title="Quick actions" caption="What would you like to do?" />
        <View style={styles.actionGrid}>
          <ActionTile title="Record a sale" caption="Offline ready" icon="cash-outline" onPress={() => router.push('/(tabs)/sell')} />
          <ActionTile title="Products" caption="Catalog & stock" icon="cube-outline" onPress={() => router.push('/(tabs)/products')} />
          <ActionTile title="Events" caption="Manage drafts" icon="calendar-outline" onPress={() => router.push('/events')} />
          <ActionTile title="Orders" caption="Track activity" icon="receipt-outline" onPress={() => router.push('/(tabs)/orders')} />
        </View>

        <SectionTitle title="Low stock" caption="Keep your shelves ready" action="Products" onPress={() => router.push('/(tabs)/products')} />
        <Card>{report.low_stock?.length ? report.low_stock.slice(0, 5).map((item) => <View key={item.id} style={styles.stockRow}>
          <View style={styles.stockIcon}><Ionicons name="alert-circle-outline" size={18} color={palette.amber} /></View>
          <Text style={{ flex: 1, color: palette.ink, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
          <StatusPill label={item.left + ' left'} tone="warning" />
        </View>) : <View style={styles.clearRow}><Ionicons name="checkmark-circle-outline" size={21} color={palette.green} /><Text style={{ color: palette.muted }}>No low stock items right now.</Text></View>}</Card>
      </>}
    </>}
  </Page>;
}

function MetricCard({ icon, title, amount }: { icon: keyof typeof Ionicons.glyphMap; title: string; amount: string }) {
  return <Card><View style={styles.metricIcon}><Ionicons name={icon} size={17} color={palette.blue} /></View>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricAmount} numberOfLines={1} adjustsFontSizeToFit>{amount}</Text>
  </Card>;
}
function ActionTile({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionTile}>
    <View style={styles.actionIcon}><Ionicons name={icon} size={21} color={palette.blue} /></View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionCaption}>{caption}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  mark: { height: 42, width: 42, borderRadius: 14, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '900', fontSize: 25 },
  overline: { fontSize: 10, fontWeight: '900', color: palette.muted, letterSpacing: 1.5 },
  workspaceName: { fontSize: 17, fontWeight: '900', color: palette.ink, marginTop: 2 },
  roundButton: { height: 42, width: 42, borderRadius: 14, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: palette.navy, borderRadius: 25, padding: 22, marginBottom: 15, overflow: 'hidden' },
  heroOrb: { position: 'absolute', right: -58, top: -110, height: 235, width: 235, borderRadius: 120, borderWidth: 35, borderColor: '#353D72', opacity: 0.65 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: '#C4CAFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 14 },
  heroDetail: { color: '#B5BBD7', fontSize: 12, marginTop: 3 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, height: 56, marginTop: 14 },
  chartColumn: { flex: 1, justifyContent: 'flex-end' },
  chartBar: { borderRadius: 5, backgroundColor: '#8D97FF', minHeight: 8 },
  chartCaption: { color: '#9EA7CC', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginTop: 7 },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricTitle: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  metricAmount: { color: palette.ink, fontSize: 18, fontWeight: '900', marginTop: 5 },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  orderCount: { color: palette.ink, fontSize: 27, fontWeight: '900' },
  orderLabel: { color: palette.muted, fontSize: 12, marginTop: 3 },
  divider: { height: 40, width: 1, backgroundColor: palette.border },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  actionTile: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 19, padding: 15, width: '48%', minHeight: 125 },
  actionIcon: { height: 34, width: 34, borderRadius: 11, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  actionTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  actionCaption: { color: palette.muted, fontSize: 11, marginTop: 3 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  stockIcon: { height: 30, width: 30, borderRadius: 10, backgroundColor: palette.amberSoft, alignItems: 'center', justifyContent: 'center' },
  clearRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { fontSize: 20, color: palette.ink, fontWeight: '900' },
  emptyDescription: { color: palette.muted, lineHeight: 21, marginTop: 7 },
});
