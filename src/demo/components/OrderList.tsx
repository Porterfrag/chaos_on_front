import { useCallback, useEffect, useState } from 'react';
import { corruptData, withChaos } from '../../lib';
import type { Order, Phase } from '../types';
import { PhaseGate } from './PhaseGate';

function OrderListInner() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [orders, setOrders] = useState<Order[]>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      setRaw(parsed);
      const safe = corruptData<Order[]>(parsed);
      if (!Array.isArray(safe)) {
        setOrders([]);
        setPhase('partial');
        return;
      }
      // Validation: each order needs a non-empty customer name.
      const allValid = safe.every((o) => o && typeof o.customer === 'string' && o.customer.length > 0);
      setOrders(safe);
      setPhase(!allValid ? 'partial' : safe.length === 0 ? 'empty' : 'ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent orders</h2>
        <button
          className="rounded text-xs font-medium text-slate-600 hover:text-slate-900"
          onClick={() => setTick((t) => t + 1)}
          title="Refetch"
        >
          ↻
        </button>
      </header>

      <PhaseGate
        phase={phase}
        partialPayload={raw}
        errorDetail={error}
        retry={() => setTick((t) => t + 1)}
        label="Orders"
        loading={<OrderSkeleton />}
        empty={<p className="text-sm text-slate-500">No orders in the last 24h.</p>}
      >
        <ul className="divide-y divide-slate-100">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-slate-500">{o.number}</p>
                <p className="truncate font-medium text-slate-900">{o.customer}</p>
                {o.shippingAddress ? (
                  <p className="truncate text-xs text-slate-500">{o.shippingAddress}</p>
                ) : (
                  <p className="truncate text-xs italic text-amber-700">address missing — pick up in store</p>
                )}
              </div>
              <div className="ml-3 text-right">
                <p className="font-semibold text-slate-900">${o.total}</p>
                <StatusPill status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      </PhaseGate>
    </section>
  );
}

export const OrderList = withChaos(OrderListInner, 'OrderList');

function StatusPill({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], string> = {
    paid: 'bg-emerald-100 text-emerald-800',
    shipped: 'bg-sky-100 text-sky-800',
    pending: 'bg-amber-100 text-amber-800',
    refunded: 'bg-slate-200 text-slate-700',
  };
  return (
    <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-24 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-5 w-12 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
