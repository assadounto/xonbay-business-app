import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import { cachedRequest } from '@/lib/offline';
import type { Shop } from '@/lib/types';
import { useAuth } from './AuthContext';

type ShopContextValue = {
  shops: Shop[]; currentShop: Shop | null; loading: boolean; error: string;
  refresh: () => Promise<Shop[]>;
  selectShop: (shop: Shop) => Promise<void>;
};
const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user, loaded } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const shopsRef = useRef<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    setError('');
    try {
      const { value: data } = await cachedRequest(user.id, 0, 'shops', () =>
        api<{ owned?: Array<Shop | { shop: Shop }>; member?: Array<Shop | { shop: Shop }> }>('/user_shops?role=all'));
      const normalize = (entry: Shop | { shop: Shop; permissions?: Record<string, boolean>; access_level?: string; member_role?: string; role?: string }, access: 'owner' | 'member'): Shop | null => {
        const shop = 'shop' in entry ? entry.shop : entry;
        if (!shop?.id) return null;
        const accessEntry = entry as Shop & { member_role?: string };
        return { ...shop, seller_access: access, is_owner: access === 'owner' || shop.is_owner === true,
          access_level: access === 'owner' ? 'owner' : String(accessEntry.access_level || accessEntry.member_role || accessEntry.role || shop.access_level || shop.role || 'member'),
          permissions: { ...shop.permissions, ...accessEntry.permissions } };
      };
      const all = [...(data.owned || []).map((item) => normalize(item, 'owner')), ...(data.member || []).map((item) => normalize(item, 'member'))];
      const byId = new Map<string, Shop>();
      all.filter((shop): shop is Shop => Boolean(shop)).forEach((shop) => {
        const key = String(shop.id);
        if (!byId.has(key) || shop.seller_access === 'owner') byId.set(key, shop);
      });
      const available = Array.from(byId.values());
      const saved = await SecureStore.getItemAsync('business_shop_' + user.id);
      const active = available.find((shop) => String(shop.id) === saved) || available[0] || null;
      shopsRef.current = available;
      setShops(available);
      setCurrentShop(active);
      if (active) await SecureStore.setItemAsync('business_shop_' + user.id, String(active.id));
      return available;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load shops');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loaded) return;
    if (user) { shopsRef.current = []; setShops([]); setCurrentShop(null); void refresh(); }
    else { shopsRef.current = []; setShops([]); setCurrentShop(null); setError(''); setLoading(false); }
  }, [loaded, user?.id, refresh]);

  const selectShop = async (shop: Shop) => {
    if (!user || !shopsRef.current.some((item) => String(item.id) === String(shop.id))) return;
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
