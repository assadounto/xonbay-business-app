import type { Href } from 'expo-router';
import type { Shop } from './types';

export type BusinessNavItem = {
  title: string;
  icon: string;
  slug: string;
  route?: Href;
  permission?: string | string[];
  ownerOnly?: boolean;
};

export const businessNavGroups: { label: string; items: BusinessNavItem[] }[] = [
  { label: 'General', items: [
    { title: 'Overview', icon: 'grid-outline', slug: '', route: '/(business)/(tabs)' },
    { title: 'Conversations', icon: 'chatbubbles-outline', slug: 'conversations', permission: 'conversations' },
    { title: 'Analytics', icon: 'bar-chart-outline', slug: 'analytics', permission: 'analytics' },
    { title: 'Files', icon: 'folder-outline', slug: 'files', permission: 'files' },
  ] },
  { label: 'Catalog & Sales', items: [
    { title: 'Products & Inventory', icon: 'cube-outline', slug: 'products', route: '/(business)/(tabs)/products', permission: 'product_inventory' },
    { title: 'Add Product', icon: 'add-circle-outline', slug: 'products/new', route: '/create-product', permission: 'add_product' },
    { title: 'Orders', icon: 'receipt-outline', slug: 'orders', route: '/(business)/(tabs)/orders', permission: 'orders_management' },
    { title: 'Collections', icon: 'pricetag-outline', slug: 'collections', permission: 'collections' },
  ] },
  { label: 'Store Operations', items: [
    { title: 'Shop Settings', icon: 'storefront-outline', slug: 'settings', permission: 'edit_shop_info' },
    { title: 'Storefront Design', icon: 'desktop-outline', slug: 'storefront-design', ownerOnly: true },
    { title: 'Team Members', icon: 'people-outline', slug: 'members', permission: 'manage_members' },
    { title: 'Delivery Areas & Fees', icon: 'location-outline', slug: 'delivery-areas', permission: 'delivery_areas' },
  ] },
  { label: 'Tools', items: [
    { title: 'Business Tools', icon: 'build-outline', slug: 'tools' },
    { title: 'Record a sale', icon: 'cash-outline', slug: 'sell', route: '/(business)/(tabs)/sell', permission: 'orders_management' },
    { title: 'Sync & storage', icon: 'cloud-upload-outline', slug: 'sync', route: '/sync-queue' },
    { title: 'Account & shops', icon: 'settings-outline', slug: 'account', route: '/(business)/(tabs)/settings' },
  ] },
  { label: 'Growth', items: [
    { title: 'Affiliate Products', icon: 'flash-outline', slug: 'affiliate', permission: 'affiliate_products' },
    { title: 'Earn by Promoting', icon: 'trending-up-outline', slug: 'affiliate/add-products', permission: 'earn_by_promoting' },
    { title: 'Events & Tickets', icon: 'calendar-outline', slug: 'events', route: '/events', permission: 'events_tickets' },
  ] },
  { label: 'Finance', items: [
    { title: 'Finance & Wallet', icon: 'card-outline', slug: 'wallet', permission: ['payout_account', 'payout_history'] },
    { title: 'Payout History', icon: 'wallet-outline', slug: 'payouts', permission: 'payout_history' },
  ] },
];

export function canAccess(shop: Shop | null, permission?: string | string[], ownerOnly = false) {
  if (!shop) return false;
  const owner = shop.seller_access === 'owner' || shop.is_owner === true || shop.access_level === 'owner';
  if (ownerOnly) return owner;
  if (owner || !permission) return true;
  const keys = Array.isArray(permission) ? permission : [permission];
  return keys.some((key) => shop.permissions?.[key] === true);
}

export function businessWebUrl(shop: Shop, slug: string) {
  const key = encodeURIComponent((shop.handle || String(shop.id)).replace(/^@/, ''));
  return `https://www.xonbay.com/business/shops/${key}/dashboard/${slug}`;
}
