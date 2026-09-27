import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { discardOperation, operations, retryOperation, type Operation } from '@/lib/offline';
import { BackButton, Card, Heading, Page, palette, PrimaryButton, SectionTitle, StatusPill } from '@/components/ui';

export default function SyncQueue() {
  const { user } = useAuth();
  const { online, syncing, sync, refresh, pending, attention } = useSync();
  const [rows, setRows] = useState<Operation[]>([]);
  const load = useCallback(async () => { setRows(user ? await operations(user.id) : []); }, [user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load, pending, attention]);
  const syncNow = async () => { await sync(); await load(); };
  const discard = (row: Operation) => Alert.alert('Discard local change?', 'This removes the unsynced ' + row.kind + ' from this device. It will not change data already online.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: async () => {
      if (!user) return;
      await discardOperation(user.id, row.id); await refresh(); await load();
    } },
  ]);
  const retry = async (row: Operation) => {
    if (!user) return;
    await retryOperation(user.id, row.id); await syncNow();
  };
  return <Page>
    <BackButton />
    <Heading eyebrow="YOUR WORKSPACE / SYNC" title="Local changes" subtitle={online ? 'Connected to Xonbay. Changes are sent when available.' : 'Your work stays on this phone until you reconnect.'} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: online ? palette.successSoft : palette.warningSoft, padding: 15, borderRadius: 18 }}><Ionicons name={online ? 'cloud-done-outline' : 'cloud-offline-outline'} color={online ? palette.success : palette.warning} size={22} /><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '900' }}>{online ? 'Online' : 'Offline'}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>{pending} waiting · {attention} need review</Text></View></View>
    <PrimaryButton title={syncing ? 'Syncing…' : 'Sync now'} loading={syncing} disabled={!online} onPress={() => void syncNow()} />
    <SectionTitle title="On this device" caption="Changes remain here until Xonbay accepts them" />
    {!rows.length && <Card><View style={{ alignItems: 'center', paddingVertical: 16 }}><Ionicons name="checkmark-circle-outline" size={32} color={palette.success} /><Text style={{ color: palette.ink, fontWeight: '900', marginTop: 10 }}>Everything is in sync</Text><Text style={{ color: palette.muted, marginTop: 4 }}>No local changes waiting.</Text></View></Card>}
    {rows.map((row) => <Card key={row.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><Text style={{ color: palette.ink, fontWeight: '900', fontSize: 16, flex: 1 }}>{row.kind === 'sale' ? 'Cash sale' : row.kind === 'stock' ? 'Stock change' : row.kind === 'product' ? 'Product draft' : 'Event draft'}</Text><StatusPill label={row.status === 'pending' ? 'Waiting' : row.status === 'conflict' ? 'Conflict' : 'Failed'} tone={row.status === 'pending' ? 'neutral' : 'warning'} /></View>
      <Text style={{ color: palette.muted, marginTop: 8, fontSize: 12 }}>Shop #{row.shop_id} · {new Date(row.created_at).toLocaleString()}</Text>
      {!!row.error && <Text style={{ color: palette.warning, marginTop: 10 }}>{row.error}</Text>}
      {row.status === 'conflict' && <Text style={{ color: palette.muted, marginTop: 8 }}>The stock changed on the server. Discard this change, refresh Products, then set stock again.</Text>}
      {row.status === 'failed' && <Pressable onPress={() => void retry(row)}><Text style={{ color: palette.primary, marginTop: 12, fontWeight: '700' }}>Retry after fixing the issue</Text></Pressable>}
      <Pressable onPress={() => discard(row)}><Text style={{ color: palette.error, marginTop: 12, fontWeight: '700' }}>Discard local change</Text></Pressable>
    </Card>)}
  </Page>;
}
