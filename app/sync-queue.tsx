import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Text, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { discardOperation, operations, retryOperation, type Operation } from '@/lib/offline';
import { Card, Heading, Page, palette, PrimaryButton, StateMessage } from '@/components/ui';

export default function SyncQueue() {
  const { user } = useAuth();
  const { online, syncing, sync, refresh } = useSync();
  const [rows, setRows] = useState<Operation[]>([]);
  const load = useCallback(async () => { setRows(user ? await operations(user.id) : []); }, [user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
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
    <Pressable onPress={() => router.back()}><Text style={{ color: palette.blue, marginBottom: 20 }}>Back</Text></Pressable>
    <Heading eyebrow="LOCAL CHANGES" title="Sync" subtitle={online ? 'Connected. Your saved changes sync to Xonbay.' : 'Offline. Changes remain on this device until connected.'} />
    <PrimaryButton title={syncing ? 'Syncing…' : 'Sync now'} loading={syncing} disabled={!online} onPress={() => void syncNow()} />
    {!rows.length && <StateMessage text="All local changes have synced." />}
    {rows.map((row) => <Card key={row.id}>
      <Text style={{ color: palette.ink, fontWeight: '800', fontSize: 16 }}>{row.kind === 'sale' ? 'Cash sale' : row.kind === 'stock' ? 'Stock change' : row.kind === 'product' ? 'Product draft' : 'Event draft'}</Text>
      <Text style={{ color: palette.muted, marginTop: 6 }}>Shop #{row.shop_id} · {new Date(row.created_at).toLocaleString()} · {row.status}</Text>
      {!!row.error && <Text style={{ color: '#B45309', marginTop: 8 }}>{row.error}</Text>}
      {row.status === 'conflict' && <Text style={{ color: palette.muted, marginTop: 8 }}>The stock changed on the server. Discard this change, refresh Products, then set stock again.</Text>}
      {row.status === 'failed' && <Pressable onPress={() => void retry(row)}><Text style={{ color: palette.blue, marginTop: 12, fontWeight: '700' }}>Retry after fixing the issue</Text></Pressable>}
      <Pressable onPress={() => discard(row)}><Text style={{ color: '#B91C1C', marginTop: 12, fontWeight: '700' }}>Discard local change</Text></Pressable>
    </Card>)}
  </Page>;
}
