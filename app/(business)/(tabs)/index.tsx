import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, money } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import { canAccess } from '@/lib/business-navigation';
import type { Dashboard } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { Card, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { currentShop, loading: shopsLoading, error: shopsError, refresh } = useShops();
  const [report, setReport] = useState<Dashboard | null>(null);
  const [reportShopId, setReportShopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!currentShop || !user) { setReport(null); return; }
    setLoading(true); setError('');
    try {
      const result = await cachedRequest(user.id, currentShop.id, 'dashboard', () => api<Dashboard>('/user_shops/' + currentShop.id + '/dashboard'));
      setReport(result.value);
      setReportShopId(currentShop.id);
      setCached(result.offline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load dashboard'); }
    finally { setLoading(false); }
  }, [currentShop?.id, user?.id]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useFocusEffect(useCallback(() => { setReport(null); void loadReport(); }, [loadReport]));

  const currency = report?.kpis?.revenue?.currency || report?.wallet?.currency || 'GHS';
  const revenue = report?.kpis?.revenue;
  const orders = report?.orders;
  const series = (report?.series?.sales_7d_ghs || []).slice(-7);
  const labels = report?.series?.daily_labels?.slice(-7);
  const maxSale = Math.max(...series.map(Number), 1);
  const sevenDayTotal = series.reduce((sum, value) => sum + Number(value || 0), 0);
  const pipeline = [
    { title: 'New Orders', value: orders?.new || 0, color: palette.warning, icon: 'time-outline' as const },
    { title: 'Processing', value: orders?.processing || 0, color: palette.primary, icon: 'cube-outline' as const },
    { title: 'Shipped', value: orders?.shipped || 0, color: palette.success, icon: 'checkmark-circle-outline' as const },
    { title: 'Cancelled', value: orders?.cancelled || 0, color: palette.error, icon: 'close-circle-outline' as const },
  ];
  const pipelineTotal = pipeline.reduce((sum, item) => sum + Number(item.value), 0);
  return <Page>
    <View style={styles.welcome}>
      <Text style={styles.eyebrow}>OVERVIEW  ·  LIVE SELLER PERFORMANCE</Text>
      <Text style={styles.welcomeTitle}>Hi, welcome back 👋</Text>
      <Text style={styles.description}>Revenue, orders and inventory health for {currentShop?.name || 'your shop'}.</Text>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => void loadReport()} style={styles.outlineButton}><Ionicons name="refresh-outline" size={16} color={palette.ink} /><Text style={styles.buttonText}>{loading ? 'Refreshing…' : 'Refresh'}</Text></Pressable>
        {canAccess(currentShop, 'add_product') && <PrimaryButton title="Add Product" onPress={() => router.push('/create-product')} />}
      </View>
    </View>
    {shopsLoading && !currentShop && <ActivityIndicator />}
    {shopsError && <StateMessage text={shopsError} onRetry={() => void refresh()} />}
    {!shopsLoading && !shopsError && !currentShop && <Card>
      <Ionicons name="storefront-outline" size={28} color={palette.primary} />
      <Text style={styles.panelTitle}>Make this space yours</Text>
      <Text style={styles.description}>Create a shop to manage your catalog, orders, events and sales.</Text>
      <PrimaryButton title="Create your first shop" onPress={() => router.push('/create-shop')} />
    </Card>}
    {currentShop && <>
      {loading && (!report || reportShopId !== currentShop.id) && <ActivityIndicator style={{ marginVertical: 30 }} />}
      {error && <StateMessage text={report && reportShopId === currentShop.id ? 'Showing your saved report. Refresh failed: ' + error : error} onRetry={() => void loadReport()} />}
      {report && reportShopId === currentShop.id && <>
        {cached && <View style={styles.banner}><StatusPill label="Saved snapshot · may be out of date" tone="warning" /></View>}
        <View style={styles.kpis}>
          <View style={styles.kpiHalf}><MetricCard title="Monthly Revenue" icon="trending-up-outline" value={money(revenue?.month_ghs || 0, currency)} detail={revenue?.growth_pct == null ? 'Current month sales' : String(revenue.growth_pct) + '% vs last month'} /></View>
          <View style={styles.kpiHalf}><MetricCard title="This Week" icon="card-outline" value={money(revenue?.week_ghs || 0, currency)} detail={'Today: ' + money(revenue?.today_ghs || 0, currency)} /></View>
          <View style={styles.kpiHalf}><MetricCard title="Average Order" icon="bag-outline" value={money(report.kpis?.average_order_value_ghs || 0, currency)} detail={String(report.kpis?.total_orders_month || 0) + ' orders this month'} /></View>
          <View style={styles.kpiHalf}><MetricCard title="Fulfillment Rate" icon="checkmark-circle-outline" value={String(orders?.fulfillment_rate || 0) + '%'} detail={String(orders?.shipped || 0) + ' shipped orders'} /></View>
        </View>

        <SectionTitle title="7-Day Revenue Trend" caption="Daily sales summary over the past week" />
        <Card>
          <View style={styles.chartHeader}><Text style={styles.panelTitle}>{money(sevenDayTotal, currency)}</Text><Text style={styles.caption}>7-DAY TOTAL</Text></View>
          {series.length ? <View style={styles.chart} accessible accessibilityLabel="Revenue over the last seven days">
            {series.map((value, index) => <View key={index} style={styles.chartColumn}>
              <View style={styles.chartTrack}><View style={[styles.chartBar, { height: Math.max(7, 118 * Number(value || 0) / maxSale) }]} /></View>
              <Text style={styles.chartDay}>{labels?.[index] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text>
            </View>)}
          </View> : <Text style={styles.description}>No sales trend available yet.</Text>}
        </Card>

        <SectionTitle title="Orders Pipeline" caption="Status distribution for this shop" action="Manage" onPress={() => router.push('/(business)/(tabs)/orders')} />
        <Card>{pipeline.map((item) => <View key={item.title} style={styles.pipelineItem}>
          <View style={styles.row}><Ionicons name={item.icon} size={18} color={item.color} /><Text style={styles.itemName}>{item.title}</Text><Text style={styles.itemValue}>{item.value}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progress, { backgroundColor: item.color, width: pipelineTotal ? String(Math.max(3, 100 * item.value / pipelineTotal)) + '%' as `${number}%` : '0%' }]} /></View>
        </View>)}</Card>

        <SectionTitle title="Recent Orders" caption="Latest customer purchases" action="View all" onPress={() => router.push('/(business)/(tabs)/orders')} />
        <Card>{report.recent_orders?.length ? report.recent_orders.slice(0, 6).map((order) => <View key={String(order.id)} style={styles.listRow}>
          <View style={styles.listIcon}><Ionicons name="cube-outline" size={18} color={palette.primary} /></View>
          <View style={styles.listDetails}><Text style={styles.itemName}>#{order.id} · {order.customer || 'Customer'}</Text><Text style={styles.caption}>{order.status || 'New order'}</Text></View>
          <Text style={styles.listAmount} numberOfLines={1}>{money(order.total_ghs || 0, order.currency || currency)}</Text>
        </View>) : <Text style={styles.description}>No orders recorded yet. New customer orders will appear here.</Text>}</Card>

        <SectionTitle title="Top Products" caption="Highest earners across your catalog" />
        <Card>{report.top_products?.length ? report.top_products.slice(0, 5).map((product, index) => <View key={product.id} style={styles.listRow}>
          <Text style={styles.rank}>#{index + 1}</Text><View style={styles.listDetails}><Text style={styles.itemName} numberOfLines={1}>{product.name}</Text><Text style={styles.caption}>{product.units_sold || 0} units sold</Text></View>
          <Text style={styles.listAmount}>{money(product.revenue || 0, currency)}</Text>
        </View>) : <Text style={styles.description}>No performance history generated yet.</Text>}</Card>

        <SectionTitle title="Low Stock" caption="Inventory that needs attention" action={canAccess(currentShop, 'product_inventory') ? 'Products' : undefined} onPress={() => router.push('/(business)/(tabs)/products')} />
        <Card>{report.low_stock?.length ? report.low_stock.slice(0, 5).map((item) => <View key={item.id} style={styles.listRow}>
          <View style={[styles.listIcon, { backgroundColor: palette.warningSoft }]}><Ionicons name="alert-circle-outline" size={18} color={palette.warning} /></View>
          <View style={styles.listDetails}><Text style={styles.itemName} numberOfLines={1}>{item.name}</Text><Text style={styles.caption}>SKU: {item.sku || 'N/A'}</Text></View>
          <StatusPill label={item.left + ' left'} tone="warning" />
        </View>) : <Text style={styles.description}>Inventory looks healthy. No low-stock products right now.</Text>}</Card>

        <SectionTitle title="Quick actions" caption="Keep your shop moving" />
        <View style={styles.actions}>
          {canAccess(currentShop, 'orders_management') && <Action title="Record a sale" icon="cash-outline" onPress={() => router.push('/(business)/(tabs)/sell')} />}
          {canAccess(currentShop, 'product_inventory') && <Action title="Products" icon="cube-outline" onPress={() => router.push('/(business)/(tabs)/products')} />}
          {canAccess(currentShop, 'events_tickets') && <Action title="Events" icon="calendar-outline" onPress={() => router.push('/events')} />}
          <Action title="Sync & storage" icon="cloud-upload-outline" onPress={() => router.push('/sync-queue')} />
        </View>
      </>}
    </>}
  </Page>;
}

function MetricCard({ title, icon, value, detail }: { title: string; icon: keyof typeof Ionicons.glyphMap; value: string; detail: string }) {
  return <Card><View style={styles.metricTop}><Text style={styles.metricLabel}>{title.toUpperCase()}</Text><Ionicons name={icon} size={18} color={palette.primary} /></View>
    <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text><Text style={styles.caption}>{detail}</Text></Card>;
}
function Action({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}><Ionicons name={icon} size={20} color={palette.primary} /><Text style={styles.itemName}>{title}</Text><Ionicons name="chevron-forward" size={15} color={palette.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  welcome: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 17, marginBottom: 15 },
  eyebrow: { color: palette.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  welcomeTitle: { fontSize: 25, fontWeight: '900', color: palette.ink, marginTop: 8 },
  description: { fontSize: 12, lineHeight: 18, color: palette.muted, marginTop: 7 },
  buttons: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' },
  outlineButton: { minHeight: 40, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  buttonText: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  banner: { marginBottom: 10 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiHalf: { width: '48.5%' },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  metricLabel: { flex: 1, color: palette.muted, fontSize: 9, fontWeight: '900', letterSpacing: .5 },
  metricValue: { fontSize: 19, fontWeight: '900', color: palette.ink, marginTop: 13 },
  caption: { color: palette.muted, fontSize: 10, marginTop: 5 },
  panelTitle: { color: palette.ink, fontSize: 16, fontWeight: '900', marginTop: 7 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chart: { height: 155, flexDirection: 'row', alignItems: 'flex-end', gap: 7, marginTop: 17 },
  chartColumn: { flex: 1, alignItems: 'center' },
  chartTrack: { height: 120, width: '100%', justifyContent: 'flex-end' },
  chartBar: { backgroundColor: palette.primary, borderTopLeftRadius: 6, borderTopRightRadius: 6, width: '100%' },
  chartDay: { fontSize: 9, color: palette.muted, marginTop: 5 },
  pipelineItem: { paddingVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  itemName: { color: palette.ink, fontWeight: '800', fontSize: 12, flex: 1 },
  itemValue: { color: palette.ink, fontWeight: '900', fontSize: 13 },
  progressTrack: { height: 5, backgroundColor: palette.surfaceSoft, borderRadius: 5, overflow: 'hidden', marginTop: 10 },
  progress: { height: 5, borderRadius: 5 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
  listIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: palette.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  listDetails: { flex: 1 },
  listAmount: { color: palette.ink, fontSize: 11, fontWeight: '900', maxWidth: 92 },
  rank: { color: palette.primary, fontSize: 12, fontWeight: '900' },
  actions: { marginBottom: 14, gap: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, padding: 14, borderRadius: 10 },
});
