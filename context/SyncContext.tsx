import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { useAuth } from './AuthContext';
import { operations, queueOperation, synchronize, type OperationKind } from '@/lib/offline';

type SyncValue = {
  online: boolean; pending: number; attention: number; syncing: boolean;
  queue: (shopId: number, kind: OperationKind, payload: object) => Promise<void>;
  sync: () => Promise<void>; refresh: () => Promise<void>;
};
const SyncContext = createContext<SyncValue | null>(null);
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [attention, setAttention] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const refresh = useCallback(async () => {
    if (!user) { setPending(0); setAttention(0); return; }
    const rows = await operations(user.id);
    setPending(rows.filter((row) => row.status === 'pending').length);
    setAttention(rows.filter((row) => row.status !== 'pending').length);
  }, [user?.id]);
  const sync = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try { await synchronize(user.id); }
    finally { await refresh(); setSyncing(false); }
  }, [user?.id, refresh]);
  const queue = useCallback(async (shopId: number, kind: OperationKind, payload: object) => {
    if (!user) throw new Error('Sign in to save changes.');
    await queueOperation(user.id, shopId, kind, payload);
    await refresh();
    void sync();
  }, [user?.id, refresh, sync]);

  useEffect(() => {
    let mounted = true;
    const update = (state: Network.NetworkState) => {
      const connected = state.isConnected !== false && state.isInternetReachable !== false;
      if (mounted) setOnline(connected);
      if (connected) void sync();
    };
    void Network.getNetworkStateAsync().then(update).catch(() => {});
    const connection = Network.addNetworkStateListener(update);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') { void refresh(); void sync(); }
    });
    void refresh();
    return () => { mounted = false; connection.remove(); foreground.remove(); };
  }, [refresh, sync]);

  return <SyncContext.Provider value={{ online, pending, attention, syncing, queue, sync, refresh }}>{children}</SyncContext.Provider>;
}
export function useSync() {
  const value = useContext(SyncContext);
  if (!value) throw new Error('SyncProvider is missing');
  return value;
}
