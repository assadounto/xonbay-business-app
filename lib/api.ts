import * as SecureStore from 'expo-secure-store';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://api.xonbay.com/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'xonbay_business_token';
const USER_KEY = 'xonbay_business_user';

export const sessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  getUser: () => SecureStore.getItemAsync(USER_KEY),
  save: async (token: string, user: unknown) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

export async function api<T>(path: string, options: RequestInit = {}, authorized = true): Promise<T> {
  const token = authorized ? await sessionStorage.getToken() : null;
  const bodyIsForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
  const raw = await response.text();
  let data: any;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { error: raw }; }
  if (!response.ok) {
    const message = data?.error || data?.message || data?.errors?.join?.(', ') || 'Request failed';
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }
  return data as T;
}
export function withQuery(path: string, values: Record<string, string | number | undefined>) {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined && value !== '');
  return path + (entries.length ? '?' + entries.map(([key, value]) =>
    encodeURIComponent(key) + '=' + encodeURIComponent(String(value))).join('&') : '');
}
export function money(amount: number, currency = 'GHS') {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0);
}
