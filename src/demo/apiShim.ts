import type { Order, ProductDetail, StockAlert, Summary } from './types';

// Simulated store of ~12 products.
const PRODUCTS: ProductDetail[] = [
  {
    id: 1,
    name: 'Sprocket Mk3',
    sku: 'SPK-MK3',
    price: 19,
    stock: 142,
    status: 'in-stock',
    description: 'The workhorse of the Sprocket line. Forged from a single billet of mild steel.',
    specs: { material: 'Mild steel', weight: '420 g', origin: 'Sheffield, UK' },
    reviews: [
      { id: 11, author: 'H. Hollerith', stars: 5, body: 'Smooth as butter. Used it on a Jacquard loom, no complaints.' },
      { id: 12, author: 'A. Turing', stars: 4, body: 'A touch noisy at 2000 rpm. Otherwise perfect.' },
    ],
  },
  {
    id: 2,
    name: 'Widget Pro',
    sku: 'WDG-PRO',
    price: 39,
    stock: 4,
    status: 'low',
    description: 'Heavy-duty widget. Comes with a complimentary widget-wrench.',
    specs: { material: 'Aluminium alloy', weight: '180 g', origin: 'Birmingham, UK' },
    reviews: [
      { id: 21, author: 'G. Hopper', stars: 5, body: 'Finally, a widget that handles COBOL-grade workloads.' },
    ],
  },
  {
    id: 3,
    name: 'Brake Pad 1"',
    sku: 'BRK-PAD-1',
    price: 9,
    stock: 0,
    status: 'out',
    description: 'Replacement brake pad for the Sprocket Mk3.',
    specs: { material: 'Composite', weight: '60 g', origin: 'Manchester, UK' },
    reviews: [],
  },
  {
    id: 4,
    name: 'Flange XL',
    sku: 'FLG-XL',
    price: 29,
    stock: 87,
    status: 'in-stock',
    description: 'Extra-large flange for high-torque applications.',
    specs: { material: 'Stainless steel', weight: '510 g', origin: 'Sheffield, UK' },
    reviews: [
      { id: 41, author: 'K. McCarthy', stars: 4, body: 'Does the job. A bit pricey for what it is.' },
      { id: 42, author: 'D. Knuth', stars: 5, body: 'I have fitted three of these to my bicycle. Beautiful.' },
    ],
  },
  {
    id: 5,
    name: 'Hex Bolt 5mm',
    sku: 'HEX-5',
    price: 0.5,
    stock: 1042,
    status: 'in-stock',
    description: 'Bag of 25. For when you absolutely, positively need a 5mm hex bolt.',
    specs: { material: 'Galvanised steel', weight: '4 g', origin: 'Coventry, UK' },
    reviews: [],
  },
  {
    id: 6,
    name: 'Cog Assembly 12T',
    sku: 'COG-12',
    price: 12,
    stock: 2,
    status: 'low',
    description: '12-tooth cog for the Sprocket Mk3 drivetrain.',
    specs: { material: 'Hardened steel', weight: '90 g', origin: 'Leeds, UK' },
    reviews: [],
  },
  {
    id: 7,
    name: 'Gasket Set A',
    sku: 'GSK-A',
    price: 6,
    stock: 250,
    status: 'in-stock',
    description: 'Set of 6 gaskets. Compatible with Mk3, XL, and Pro lines.',
    specs: { material: 'Nitrile rubber', weight: '30 g', origin: 'Bristol, UK' },
    reviews: [],
  },
  {
    id: 8,
    name: 'Drive Shaft 1.2m',
    sku: 'DRV-120',
    price: 49,
    stock: 18,
    status: 'in-stock',
    description: '1.2 m hardened drive shaft, pre-balanced.',
    specs: { material: 'Carbon steel', weight: '2.1 kg', origin: 'Sheffield, UK' },
    reviews: [],
  },
  {
    id: 9,
    name: 'Bearing 6204',
    sku: 'BRG-6204',
    price: 4,
    stock: 0,
    status: 'out',
    description: 'Sealed deep-groove ball bearing. The standard.',
    specs: { material: 'Chrome steel', weight: '110 g', origin: 'Gothenburg, SE' },
    reviews: [],
  },
  {
    id: 10,
    name: 'Pulley 4"',
    sku: 'PUL-4',
    price: 14,
    stock: 60,
    status: 'in-stock',
    description: '4-inch V-belt pulley. A-belt compatible.',
    specs: { material: 'Cast iron', weight: '320 g', origin: 'Lyon, FR' },
    reviews: [],
  },
  {
    id: 11,
    name: 'Coupler 1/2"',
    sku: 'CPL-12',
    price: 8,
    stock: 1,
    status: 'low',
    description: 'Half-inch rigid coupler. Bolts not included.',
    specs: { material: 'Aluminium', weight: '70 g', origin: 'Stuttgart, DE' },
    reviews: [],
  },
  {
    id: 12,
    name: 'Spring Kit',
    sku: 'SPR-KIT',
    price: 22,
    stock: 41,
    status: 'in-stock',
    description: 'Assorted springs, 12 in a kit.',
    specs: { material: 'Spring steel', weight: '180 g', origin: 'Sheffield, UK' },
    reviews: [],
  },
];

const ORDERS: Order[] = [
  { id: 1029, number: '#1029', customer: 'Ada Lovelace', total: 58, status: 'paid', placedAt: '2026-10-13T08:42:00Z', shippingAddress: '12 St James Square, London' },
  { id: 1028, number: '#1028', customer: 'A. Babbage', total: 142, status: 'shipped', placedAt: '2026-10-13T07:10:00Z', shippingAddress: '1 Dorset Street, London' },
  { id: 1027, number: '#1027', customer: 'K. McCarthy', total: 9, status: 'pending', placedAt: '2026-10-13T06:55:00Z', shippingAddress: null },
  { id: 1026, number: '#1026', customer: 'D. Knuth', total: 312, status: 'paid', placedAt: '2026-10-12T22:13:00Z', shippingAddress: '44 Wadsworth, Stanford CA' },
  { id: 1025, number: '#1025', customer: 'G. Hopper', total: 24, status: 'refunded', placedAt: '2026-10-12T19:02:00Z', shippingAddress: '1701 Pennsylvania Ave, DC' },
  { id: 1024, number: '#1024', customer: 'H. Hollerith', total: 87, status: 'shipped', placedAt: '2026-10-12T16:48:00Z', shippingAddress: '90 Broad St, New York' },
];

const SUMMARY: Summary = {
  revenue: 8420,
  revenueDeltaPct: 12,
  trend: [42, 38, 51, 47, 60, 55, 71, 68, 80, 76, 92, 88],
  orders: 142,
  failedOrders: 3,
  lowStockCount: 3,
};

// Stock alerts: include one entry with a null name to exercise the
// "data injector deleted a field" / "API returned null" failure path.
const STOCK_ALERTS: StockAlert[] = [
  { id: 3, name: 'Brake Pad 1"', stock: 0, reorderAt: 10 },
  { id: 11, name: 'Coupler 1/2"', stock: 1, reorderAt: 5 },
  { id: 2, name: 'Widget Pro', stock: 4, reorderAt: 10 },
  { id: 9, name: null, stock: 0, reorderAt: 20 },
];

const PAGE_SIZE = 5;

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 });
}

const realFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, window.location.origin);
  const path = url.pathname;
  const method = (init?.method ?? 'GET').toUpperCase();

  // /api/summary
  if (path === '/api/summary' && method === 'GET') return ok(SUMMARY);

  // /api/stock-alerts
  if (path === '/api/stock-alerts' && method === 'GET') return ok(STOCK_ALERTS);

  // /api/orders
  if (path === '/api/orders' && method === 'GET') return ok(ORDERS);

  // /api/products (list with filters)
  if (path === '/api/products' && method === 'GET') {
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const status = url.searchParams.get('status') ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const filtered = PRODUCTS.filter((p) => {
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesStatus = !status || p.status === status;
      return matchesQ && matchesStatus;
    });
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    return ok({ items, nextPage: start + PAGE_SIZE < filtered.length ? page + 1 : null });
  }

  // /api/products/:id
  const productMatch = path.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && method === 'GET') {
    const id = Number(productMatch[1]);
    const found = PRODUCTS.find((p) => p.id === id);
    return found ? ok(found) : notFound();
  }

  // POST /api/products/:id/restock
  const restockMatch = path.match(/^\/api\/products\/(\d+)\/restock$/);
  if (restockMatch && method === 'POST') {
    const id = Number(restockMatch[1]);
    const found = PRODUCTS.find((p) => p.id === id);
    if (!found) return notFound();
    found.stock += 25;
    if (found.stock > 0 && found.status === 'out') found.status = 'low';
    if (found.stock > 10) found.status = 'in-stock';
    return ok({ ok: true, product: found });
  }

  return realFetch(input, init);
};
