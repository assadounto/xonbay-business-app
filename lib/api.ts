import * as SecureStore from 'expo-secure-store';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://api.xonbay.com/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'xonbay_business_token';
const USER_KEY = 'xonbay_business_user';
const REFRESH_KEY = 'xonbay_business_refresh_token';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export const sessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  getUser: () => SecureStore.getItemAsync(USER_KEY),
  save: async (token: string, user: unknown, refreshToken?: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

let refreshPromise: Promise<string | null> | undefined;
async function refreshAccess() {
  refreshPromise ||= (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const response = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.token) return null;
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      return data.token as string;
    } catch { return null; }
  })();
  try { return await refreshPromise; } finally { refreshPromise = undefined; }
}

export async function api<T>(path: string, options: RequestInit = {}, authorized = true): Promise<T> {
  const token = authorized ? await sessionStorage.getToken() : null;
  const bodyIsForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response = await fetch(API_BASE + path, {
    ...options,
    signal: options.signal || controller.signal,
    headers: {
      Accept: 'application/json',
      ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  }).finally(() => clearTimeout(timer));
  if (response.status === 401 && authorized) {
    const updatedToken = await refreshAccess();
    if (updatedToken) response = await fetch(API_BASE + path, {
      ...options,
      headers: { Accept: 'application/json', ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }), ...options.headers, Authorization: 'Bearer ' + updatedToken },
    });
  }
  const raw = await response.text();
  let data: any;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { error: raw }; }
  if (!response.ok) {
    const message = data?.error || data?.message || data?.errors?.join?.(', ') || 'Request failed';
    throw new ApiError(typeof message === 'string' ? message : 'Request failed', response.status);
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
