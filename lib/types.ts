export type User = { id: number; name?: string; email?: string };
export type Shop = {
  id: number; name: string; logo_url?: string; image_url?: string; role?: string;
  handle?: string; city?: string; region?: string; category?: string | { name?: string };
  seller_access?: 'owner' | 'member'; access_level?: string; verified?: boolean; is_verified?: boolean;
  is_owner?: boolean; permissions?: Record<string, boolean>;
  products_count?: number; stats?: { products?: number };
  wallet_preview?: { available_pesewas?: number; currency?: string };
};
export type Dashboard = {
  kpis?: { revenue?: { today_ghs?: number; week_ghs?: number; month_ghs?: number; growth_pct?: number; currency?: string }; average_order_value_ghs?: number; total_orders_month?: number };
  orders?: { new?: number; processing?: number; shipped?: number; cancelled?: number; fulfillment_rate?: number };
  series?: { sales_7d_ghs?: number[]; daily_labels?: string[] };
  wallet?: { currency?: string };
  recent_orders?: Array<{ id: number | string; customer?: string; total_ghs?: number; currency?: string; status?: string }>;
  top_products?: Array<{ id: number; name: string; image_url?: string; units_sold?: number; revenue?: number }>;
  low_stock?: Array<{ id: number; name: string; left: number; sku?: string; image_url?: string }>;
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
