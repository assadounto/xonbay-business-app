import React, { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { useSync } from '@/context/SyncContext';
import { Card, Heading, Page, palette, PrimaryButton, SectionTitle, StateMessage, StatusPill } from '@/components/ui';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { shops, currentShop, selectShop, loading, error, refresh } = useShops();
  const { online, pending, attention } = useSync();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try { await signOut(); router.replace('/login'); }
    catch (cause) { Alert.alert('Could not sign out', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <Heading eyebrow="YOUR WORKSPACE / ACCOUNT" title="Settings" subtitle="Shops, sync and account preferences." />
    <SectionTitle title="Your shops" caption="Switch workspaces anytime" />
    {loading && <ActivityIndicator />}
    {error && <StateMessage text={error} onRetry={() => void refresh()} />}
    {!loading && !error && !shops.length && <StateMessage text="You do not have a shop yet." />}
    {shops.map((shop) => <Pressable key={shop.id} accessibilityRole="button" onPress={() => void selectShop(shop)}>
      <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 43, height: 43, borderRadius: 14, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.blue, fontWeight: '900', fontSize: 17 }}>{shop.name.slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>{shop.name}</Text><Text style={{ color: palette.muted, marginTop: 4, fontSize: 12 }}>{shop.role || 'Shop'}</Text></View>
        {shop.id === currentShop?.id ? <StatusPill label="Active" tone="good" /> : <Ionicons name="chevron-forward" size={17} color={palette.muted} />}
      </View></Card>
    </Pressable>)}
    <PrimaryButton title="Create another shop" onPress={() => router.push('/create-shop')} />
    <SectionTitle title="Sync & storage" caption="Keep track of changes saved on this phone" />
    <Pressable accessibilityRole="button" onPress={() => router.push('/sync-queue')}><Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: palette.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={online ? 'cloud-done-outline' : 'cloud-offline-outline'} size={20} color={palette.blue} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '800' }}>{online ? 'Connected' : 'Working offline'}</Text><Text style={{ color: palette.muted, marginTop: 4, fontSize: 12 }}>{pending} waiting · {attention} need review</Text></View>
      <Ionicons name="chevron-forward" size={17} color={palette.muted} />
    </View></Card></Pressable>
    <SectionTitle title="Account" />
    <Card><Text style={{ color: palette.ink, fontWeight: '800', fontSize: 15 }}>{user?.name || 'Merchant'}</Text><Text style={{ color: palette.muted, marginTop: 6 }}>{user?.email || 'Xonbay account'}</Text></Card>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void logout()} style={{ padding: 16, alignItems: 'center', marginBottom: 12 }}><Text style={{ color: '#B83E4B', fontWeight: '800' }}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
  </Page>;
}
