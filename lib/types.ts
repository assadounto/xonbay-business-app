export type User = { id: number; name?: string; email?: string };
export type Shop = { id: number; name: string; logo_url?: string; role?: string };
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
  kind?: string; sku?: string;
};
