import { corruptData, useChaosCrash } from '../../lib';
import { useEffect, useState } from 'react';

interface Metrics {
  visits: number;
  signups: number;
  revenue: number;
}

/** Dashboard with metric cards. Crash-prone via useChaosCrash; metrics pass through corruptData. */
export function Dashboard() {
  useChaosCrash('Dashboard');

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = corruptData<Metrics>(await res.json());
        if (!cancelled) setMetrics(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Dashboard</h2>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Metrics unavailable: {error}</p>}
      {!error && (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Visits" value={metrics?.visits} />
          <MetricCard label="Signups" value={metrics?.signups} />
          <MetricCard label="Revenue" value={metrics?.revenue} prefix="$" />
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value, prefix = '' }: { label: string; value: number | undefined; prefix?: string }) {
  const display =
    value === undefined || value === null
      ? '—'
      : typeof value === 'number' && Number.isFinite(value)
        ? `${prefix}${value.toLocaleString()}`
        : String(value);

  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${display === '—' ? 'animate-pulse text-slate-400' : 'text-slate-900'}`}>
        {display}
      </p>
    </div>
  );
}
