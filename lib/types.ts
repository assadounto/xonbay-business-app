export type User = { id: number; name?: string; email?: string };
export type Shop = {
  id: number; name: string; logo_url?: string; image_url?: string; role?: string;
  handle?: string; city?: string; region?: string; category?: string | { name?: string };
  seller_access?: 'owner' | 'member'; access_level?: string; verified?: boolean; is_verified?: boolean;
  products_count?: number; stats?: { products?: number };
  wallet_preview?: { available_pesewas?: number; currency?: string };
};
export type Dashboard = {
  kpis?: { revenue?: { today_ghs?: number; week_ghs?: number; month_ghs?: number; currency?: string } };
  orders?: { new?: number; processing?: number; shipped?: number; cancelled?: number };
  series?: { sales_7d_ghs?: number[] };
  low_stock?: Array<{ id: number; name: string; left: number }>;
};
export type Order = {
  id: number | string; order_number?: string; status?: string;
  fulfillment_status?: string; amount_pesewas?: number; total_ghs?: number;
  currency?: string; created_at?: string;
  customer?: { name?: string } | string;
  order_items?: Array<{ id: number; name?: string; quantity?: number }>;
};
export type Product = {
  id: number; name: string; price?: number | string; quantity?: number;
  active?: boolean; image_url?: string; images?: Array<string | { url?: string }>;
  kind?: string; sku?: string; variations?: unknown[];
};
export type Event = {
  id: number; title: string; status?: string; start_at?: string; end_at?: string;
  venue_name?: string; venue_city?: string; description?: string;
};
