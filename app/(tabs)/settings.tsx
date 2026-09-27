import React, { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useShops } from '@/context/ShopContext';
import { Card, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { shops, currentShop, selectShop, loading, error, refresh } = useShops();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try { await signOut(); router.replace('/login'); }
    catch (cause) { Alert.alert('Could not sign out', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <Heading eyebrow="ACCOUNT" title="Settings" subtitle={user?.name || user?.email || 'Your Xonbay account'} />
    <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Your shops</Text>
    {loading && <ActivityIndicator />}
    {error && <StateMessage text={error} onRetry={() => void refresh()} />}
    {!loading && !error && !shops.length && <StateMessage text="You do not have a shop yet." />}
    {shops.map((shop) => <Pressable key={shop.id} accessibilityRole="button" onPress={() => void selectShop(shop)}>
      <Card><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: palette.ink, fontWeight: '800', flex: 1 }}>{shop.name}</Text>
        {shop.id === currentShop?.id && <Text style={{ color: palette.blue, fontWeight: '800' }}>Selected</Text>}
      </View><Text style={{ color: palette.muted, marginTop: 7 }}>{shop.role || 'Shop'}</Text></Card>
    </Pressable>)}
    <PrimaryButton title="Create another shop" onPress={() => router.push('/create-shop')} />
    <View style={{ marginTop: 28 }}><Card><Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16 }}>Signed in as</Text><Text style={{ color: palette.muted, marginTop: 8 }}>{user?.email || user?.name}</Text></Card></View>
    <PrimaryButton title="Sign out" loading={busy} onPress={() => void logout()} />
  </Page>;
}
