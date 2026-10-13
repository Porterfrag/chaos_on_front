import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { corruptData, useChaosCrash } from '../../lib';
import type { Phase, Summary } from '../types';
import { PhaseGate } from './PhaseGate';
import { Sparkline } from './Sparkline';

export function SummaryCards() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [data, setData] = useState<Summary | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch('/api/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      setRaw(parsed);
      const safe = corruptData<Summary>(parsed);
      // Light validation: a few fields must exist and be the right type.
      const valid =
        safe &&
        typeof safe.revenue === 'number' &&
        typeof safe.orders === 'number' &&
        Array.isArray(safe.trend);
      if (!valid) {
        setData(null);
        setPhase('partial');
        return;
      }
      setData(safe);
      setPhase('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card title="Revenue (today)" onRetry={() => setTick((t) => t + 1)}>
        <PhaseGate
          phase={phase}
          partialPayload={raw}
          errorDetail={error}
          retry={() => setTick((t) => t + 1)}
          label="Summary"
          loading={<RevenueSkeleton />}
          empty={<p className="text-sm text-slate-500">No revenue to show yet.</p>}
        >
          {data && <RevenueCardContent data={data} />}
        </PhaseGate>
      </Card>

      <Card title="Orders" onRetry={() => setTick((t) => t + 1)}>
        <PhaseGate
          phase={phase}
          partialPayload={raw}
          errorDetail={error}
          retry={() => setTick((t) => t + 1)}
          label="Orders"
          loading={<BigNumberSkeleton />}
          empty={<p className="text-sm text-slate-500">No orders yet.</p>}
        >
          {data && (
            <div>
              <p className="text-3xl font-bold text-slate-900">{data.orders.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-500">
                {data.failedOrders > 0 ? (
                  <span className="text-red-600">{data.failedOrders} failed today</span>
                ) : (
                  '0 failed today'
                )}
              </p>
            </div>
          )}
        </PhaseGate>
      </Card>

      <LowStockCard onRetry={() => setTick((t) => t + 1)} />
    </div>
  );
}

function Card({ title, children, onRetry }: { title: string; children: ReactNode; onRetry: () => void }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        <button
          className="rounded text-xs font-medium text-slate-600 hover:text-slate-900"
          onClick={onRetry}
          title="Refetch this card"
        >
          ↻
        </button>
      </header>
      {children}
    </section>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 flex h-8 gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 animate-pulse rounded-sm bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

function BigNumberSkeleton() {
  return <div className="h-9 w-20 animate-pulse rounded bg-slate-200" />;
}

function RevenueCardContent({ data }: { data: Summary }) {
  const positive = data.revenueDeltaPct >= 0;
  return (
    <div>
      <p className="text-3xl font-bold text-slate-900">${data.revenue.toLocaleString()}</p>
      <p className={`mt-1 text-sm ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
        {positive ? '+' : ''}
        {data.revenueDeltaPct}% vs yesterday
      </p>
      <Sparkline values={data.trend} className="mt-3" />
    </div>
  );
}

function LowStockCard({ onRetry }: { onRetry: () => void }) {
  useChaosCrash('LowStockCard');
  return <LowStockCardBody onRetry={onRetry} />;
}

function LowStockCardBody({ onRetry }: { onRetry: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<Array<{ id: number; name: string | null; stock: number }>>([]);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch('/api/stock-alerts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();
      setRaw(parsed);
      const safe = corruptData<typeof items>(parsed);
      if (!Array.isArray(safe)) {
        setItems([]);
        setPhase('partial');
        return;
      }
      // Treat "no name" as corrupt, not empty.
      const hasNullName = safe.some((it) => it && (it.name === null || it.name === undefined));
      if (hasNullName) {
        setItems(safe);
        setPhase('partial');
        return;
      }
      setItems(safe);
      setPhase(safe.length === 0 ? 'empty' : 'ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  return (
    <Card title="Low stock" onRetry={onRetry}>
      <PhaseGate
        phase={phase}
        partialPayload={raw}
        errorDetail={error}
        retry={() => setTick((t) => t + 1)}
        label="Low stock"
        loading={<ListSkeleton rows={3} />}
        empty={<p className="text-sm text-slate-500">No low-stock items. 🎉</p>}
      >
        <ul className="space-y-1 text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between">
              <span className={it.name ? 'text-slate-800' : 'text-red-600 italic'}>
                {it.name ?? '(unnamed product)'}
              </span>
              <span className="font-mono text-xs text-slate-500">{it.stock} left</span>
            </li>
          ))}
        </ul>
      </PhaseGate>
    </Card>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  );
}
