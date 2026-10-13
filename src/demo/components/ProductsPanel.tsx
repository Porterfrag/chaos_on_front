import { useCallback, useEffect, useState } from 'react';
import { corruptData } from '../../lib';
import type { Phase, Product, ProductStatus } from '../types';
import { PhaseGate } from './PhaseGate';
import { ProductDetail } from './ProductDetail';

type StatusFilter = '' | ProductStatus;

export function ProductsPanel() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<Product[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const buildUrl = useCallback(() => {
    const u = new URL('/api/products', window.location.origin);
    if (query) u.searchParams.set('q', query);
    if (status) u.searchParams.set('status', status);
    u.searchParams.set('page', String(page));
    return u.pathname + u.search;
  }, [query, status, page]);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      setRaw(parsed);
      const safe = corruptData<{ items: Product[]; nextPage: number | null }>(parsed);
      if (!safe || !Array.isArray(safe.items)) {
        setItems([]);
        setHasMore(false);
        setPhase('partial');
        return;
      }
      // Validate each item has the basic shape.
      const allValid = safe.items.every(
        (p) => p && typeof p.id === 'number' && typeof p.name === 'string' && typeof p.price === 'number',
      );
      setItems(safe.items);
      setHasMore(safe.nextPage !== null);
      if (!allValid) setPhase('partial');
      else setPhase(safe.items.length === 0 ? 'empty' : 'ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, [buildUrl]);

  useEffect(() => {
    void load();
  }, [load, fetchKey]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [query, status]);

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Products</h2>
          <button
            className="rounded text-xs font-medium text-slate-600 hover:text-slate-900"
            onClick={() => setFetchKey((k) => k + 1)}
            title="Refetch"
          >
            ↻
          </button>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm placeholder-slate-400"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All statuses</option>
            <option value="in-stock">In stock</option>
            <option value="low">Low</option>
            <option value="out">Out</option>
          </select>
        </div>

        <PhaseGate
          phase={phase}
          partialPayload={raw}
          errorDetail={error}
          retry={() => setFetchKey((k) => k + 1)}
          label="Products"
          loading={<ProductListSkeleton />}
          empty={
            <p className="py-6 text-center text-sm text-slate-500">
              No products match your filters.
            </p>
          }
        >
          <ProductTable items={items} onSelect={setSelectedId} />
          {hasMore && (
            <div className="mt-3 flex justify-center">
              <button
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more
              </button>
            </div>
          )}
        </PhaseGate>
      </section>

      {selectedId !== null && <ProductDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function ProductTable({ items, onSelect }: { items: Product[]; onSelect: (id: number) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="py-1">Name</th>
          <th className="py-1 text-right">Price</th>
          <th className="py-1 text-right">Stock</th>
          <th className="py-1 text-right">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((p) => (
          <tr
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="cursor-pointer hover:bg-slate-50"
          >
            <td className="py-2">
              <p className="font-medium text-slate-900">{p.name}</p>
              <p className="font-mono text-xs text-slate-500">{p.sku}</p>
            </td>
            <td className="py-2 text-right text-slate-900">${p.price.toFixed(2)}</td>
            <td className="py-2 text-right font-mono text-slate-700">{p.stock}</td>
            <td className="py-2 text-right">
              <StatusPill status={p.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, string> = {
    'in-stock': 'bg-emerald-100 text-emerald-800',
    low: 'bg-amber-100 text-amber-800',
    out: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

function ProductListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
