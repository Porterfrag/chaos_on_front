import { useCallback, useEffect, useState } from 'react';
import { corruptData } from '../../lib';
import type { Phase, ProductDetail as ProductDetailType } from '../types';
import { PhaseGate } from './PhaseGate';

export function ProductDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [restocking, setRestocking] = useState(false);
  const [restockMsg, setRestockMsg] = useState<string>('');
  const [fetchKey, setFetchKey] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      setRaw(parsed);
      const safe = corruptData<ProductDetailType>(parsed);
      const valid =
        safe &&
        typeof safe.name === 'string' &&
        typeof safe.price === 'number' &&
        safe.specs &&
        typeof safe.specs === 'object';
      if (!valid) {
        setProduct(null);
        setPhase('partial');
        return;
      }
      setProduct(safe);
      setPhase('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, fetchKey]);

  const restock = useCallback(async () => {
    setRestocking(true);
    setRestockMsg('');
    try {
      const res = await fetch(`/api/products/${id}/restock`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { ok: boolean; product?: ProductDetailType } = await res.json();
      const safe = corruptData<typeof data>(data);
      if (safe?.ok && safe.product) {
        setProduct(safe.product);
        setRestockMsg(`Restocked. New stock: ${safe.product.stock}`);
      } else {
        setRestockMsg('Restock returned a confused payload — try again.');
      }
    } catch (e) {
      setRestockMsg(`Restock failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRestocking(false);
    }
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-900/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Product detail</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <PhaseGate
          phase={phase}
          partialPayload={raw}
          errorDetail={error}
          retry={() => setFetchKey((k) => k + 1)}
          label="Product"
          loading={<DetailSkeleton />}
          empty={<p className="text-sm text-slate-500">No product data.</p>}
        >
          {product && <DetailContent product={product} restocking={restocking} restock={restock} restockMsg={restockMsg} />}
        </PhaseGate>
      </div>
    </div>
  );
}

function DetailContent({
  product,
  restocking,
  restock,
  restockMsg,
}: {
  product: ProductDetailType;
  restocking: boolean;
  restock: () => void;
  restockMsg: string;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
        <p className="font-mono text-xs text-slate-500">{product.sku}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">${product.price.toFixed(2)}</p>
      <p className="text-slate-700">{product.description}</p>

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
        <div>
          <dt className="text-slate-500">Material</dt>
          <dd className="font-medium text-slate-900">{product.specs.material}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Weight</dt>
          <dd className="font-medium text-slate-900">{product.specs.weight}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Origin</dt>
          <dd className="font-medium text-slate-900">{product.specs.origin}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <span className="text-slate-500">In stock:</span>
        <span className="font-mono font-medium text-slate-900">{product.stock}</span>
      </div>

      <button
        onClick={restock}
        disabled={restocking}
        className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {restocking ? 'Restocking…' : 'Restock +25'}
      </button>
      {restockMsg && (
        <p className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-700">{restockMsg}</p>
      )}

      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Reviews</h4>
        {product.reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-2">
            {product.reviews.map((r) => (
              <li key={r.id} className="rounded border border-slate-200 p-2">
                <p className="text-xs font-semibold text-slate-700">
                  {r.author} <span className="text-amber-500">{'★'.repeat(r.stars)}</span>
                </p>
                <p className="text-sm text-slate-700">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-16 w-full animate-pulse rounded bg-slate-200" />
    </div>
  );
}
