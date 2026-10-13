export type ProductStatus = 'in-stock' | 'low' | 'out';
export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

export interface ProductDetail extends Product {
  description: string;
  specs: {
    material: string;
    weight: string;
    origin: string;
  };
  reviews: Array<{
    id: number;
    author: string;
    stars: number;
    body: string;
  }>;
}

export interface StockAlert {
  id: number;
  name: string | null;
  stock: number;
  reorderAt: number;
}

export interface Order {
  id: number;
  number: string;
  customer: string;
  total: number;
  status: 'paid' | 'shipped' | 'pending' | 'refunded';
  placedAt: string;
  shippingAddress: string | null;
}

export interface Summary {
  revenue: number;
  revenueDeltaPct: number;
  trend: number[];
  orders: number;
  failedOrders: number;
  lowStockCount: number;
}

export type Phase = 'idle' | 'loading' | 'ok' | 'error' | 'partial' | 'empty';
