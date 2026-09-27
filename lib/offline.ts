import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';
import * as Crypto from 'expo-crypto';
import { api, ApiError } from './api';

export type OperationKind = 'sale' | 'stock' | 'product' | 'event';
export type Operation = {
  id: string; user_id: number; shop_id: number; kind: OperationKind;
  payload: string; status: 'pending' | 'conflict' | 'failed'; error: string | null;
  created_at: number;
};

let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ||= (async () => {
    const instance = await SQLite.openDatabaseAsync('xonbay-business.db');
    await instance.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS snapshots (
        user_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, resource TEXT NOT NULL,
        payload TEXT NOT NULL, saved_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, shop_id, resource)
      );
      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, shop_id INTEGER NOT NULL,
        kind TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
        error TEXT, created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS outbox_owner ON outbox (user_id, status, created_at);
    `);
    return instance;
  })();
  return database;
}

export async function readSnapshot<T>(userId: number, shopId: number, resource: string): Promise<T | null> {
  const row = await (await db()).getFirstAsync<{ payload: string }>(
    'SELECT payload FROM snapshots WHERE user_id = ? AND shop_id = ? AND resource = ?', userId, shopId, resource);
  return row ? JSON.parse(row.payload) as T : null;
}
export async function saveSnapshot<T>(userId: number, shopId: number, resource: string, value: T) {
  await (await db()).runAsync(
    'INSERT OR REPLACE INTO snapshots (user_id, shop_id, resource, payload, saved_at) VALUES (?, ?, ?, ?, ?)',
    userId, shopId, resource, JSON.stringify(value), Date.now());
}
export async function cachedRequest<T>(userId: number, shopId: number, resource: string, get: () => Promise<T>) {
  try {
    const value = await get();
    await saveSnapshot(userId, shopId, resource, value);
    return { value, offline: false };
  } catch (error) {
    // Authorization and validation failures should never be hidden by old local data.
    if (error instanceof ApiError && error.status < 500) throw error;
    const value = await readSnapshot<T>(userId, shopId, resource);
    if (value === null) throw error;
    return { value, offline: true };
  }
}

export async function cachedCollection<T>(
  userId: number, shopId: number, resource: string,
  path: (page: number) => string, extract: (response: any) => T[],
) {
  return cachedRequest<T[]>(userId, shopId, resource, async () => {
    const all: T[] = [];
    for (let page = 1; page <= 200; page++) {
      const response = await api<any>(path(page));
      const items = extract(response);
      all.push(...items);
      const meta = response.meta || {};
      const totalPages = Number(meta.total_pages ?? (meta.total ? Math.ceil(Number(meta.total) / 100) : page));
      if (page >= totalPages || items.length === 0) return all;
    }
    throw new Error('The catalog is too large to download completely on this device.');
  });
}

export async function queueOperation(userId: number, shopId: number, kind: OperationKind, payload: object) {
  const id = Crypto.randomUUID();
  await (await db()).runAsync(
    'INSERT INTO outbox (id, user_id, shop_id, kind, payload, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, userId, shopId, kind, JSON.stringify(payload), 'pending', Date.now());
  return id;
}
export async function operations(userId: number, shopId?: number) {
  const database = await db();
  return shopId === undefined
    ? database.getAllAsync<Operation>('SELECT * FROM outbox WHERE user_id = ? ORDER BY created_at, id', userId)
    : database.getAllAsync<Operation>('SELECT * FROM outbox WHERE user_id = ? AND shop_id = ? ORDER BY created_at, id', userId, shopId);
}
export async function discardOperation(userId: number, id: string) {
  await (await db()).runAsync('DELETE FROM outbox WHERE user_id = ? AND id = ?', userId, id);
}
export async function retryOperation(userId: number, id: string) {
  await (await db()).runAsync("UPDATE outbox SET status = 'pending', error = NULL WHERE user_id = ? AND id = ?", userId, id);
}
async function mark(row: Operation, status: Operation['status'], message: string) {
  await (await db()).runAsync('UPDATE outbox SET status = ?, error = ? WHERE id = ? AND user_id = ?', status, message, row.id, row.user_id);
}

let syncInProgress = false;
export async function synchronize(userId: number): Promise<void> {
  if (syncInProgress) return;
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false || state.isInternetReachable === false) return;
  syncInProgress = true;
  try {
    for (const row of await operations(userId)) {
      if (row.status !== 'pending') continue;
      const payload = JSON.parse(row.payload);
      try {
        if (row.kind === 'sale') {
          await api('/shops/' + row.shop_id + '/orders/in_house', {
            method: 'POST', body: JSON.stringify({ order: { ...payload, client_operation_id: row.id } }),
          });
        } else if (row.kind === 'stock') {
          // A queued stock set may be stale after another device or an online sale.
          const current = await api<{ quantity?: number }>('/shop_products/' + payload.shop_product_id);
          if (Number(current.quantity) !== Number(payload.expected_quantity)) {
            await mark(row, 'conflict', 'Stock changed online. Review this adjustment.');
            continue;
          }
          await api('/shops/' + row.shop_id + '/inventory/update_stock', {
            method: 'POST', body: JSON.stringify({ shop_product_id: payload.shop_product_id, quantity: payload.quantity }),
          });
        } else if (row.kind === 'product') {
          await api('/shop_products', {
            method: 'POST', body: JSON.stringify({ shop_product: { ...payload, shop_id: row.shop_id, info: { ...(payload.info || {}), client_operation_id: row.id } } }),
          });
        } else if (row.kind === 'event') {
          await api('/shops/' + row.shop_id + '/events', {
            method: 'POST', body: JSON.stringify({ event: { ...payload, info: { ...(payload.info || {}), client_operation_id: row.id } } }),
          });
        }
        await discardOperation(userId, row.id);
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403) break;
          if (error.status >= 400 && error.status < 500) {
            await mark(row, 'failed', error.message);
            continue;
          }
        }
        // Leave the operation pending after timeouts/5xx; server IDs make creates retry safe.
        break;
      }
    }
  } finally { syncInProgress = false; }
}
