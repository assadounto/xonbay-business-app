import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import type { Shop } from '@/lib/types';
import { useAuth } from './AuthContext';

type ShopContextValue = {
  shops: Shop[]; currentShop: Shop | null; loading: boolean; error: string;
  refresh: () => Promise<void>;
  selectShop: (shop: Shop) => Promise<void>;
};
const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user, loaded } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await api<{ owned?: Shop[]; member?: Shop[] }>('/user_shops?role=all');
      const available = [...(data.owned || []), ...(data.member || [])];
      const saved = await SecureStore.getItemAsync('business_shop_' + user.id);
      const active = available.find((shop) => String(shop.id) === saved) || available[0] || null;
      setShops(available);
      setCurrentShop(active);
      if (active) await SecureStore.setItemAsync('business_shop_' + user.id, String(active.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load shops');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loaded) return;
    if (user) { void refresh(); }
    else { setShops([]); setCurrentShop(null); setError(''); setLoading(false); }
  }, [loaded, user?.id, refresh]);

  const selectShop = async (shop: Shop) => {
    if (!user || !shops.some((item) => item.id === shop.id)) return;
    await SecureStore.setItemAsync('business_shop_' + user.id, String(shop.id));
    setCurrentShop(shop);
  };

  return <ShopContext.Provider value={{ shops, currentShop, loading, error, refresh, selectShop }}>{children}</ShopContext.Provider>;
}
export function useShops() {
  const value = useContext(ShopContext);
  if (!value) throw new Error('ShopProvider is missing');
  return value;
}
