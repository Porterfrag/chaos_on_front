import { useCallback, useEffect, useState } from 'react';
import { corruptData } from '../../lib';
import type { User } from '../types';

type Phase = 'loading' | 'ok' | 'error' | 'corrupted';

/**
 * "Fetches" a user profile. The request goes through window.fetch, so the
 * network injector can delay/fail/garble it, and the payload passes
 * through corruptData() so the data injector can mangle it. If a fake API
 * URL is used, fetch is intercepted before hitting the network.
 */
export function UserProfile() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      // Simulated API endpoint — resolved locally, but still via fetch so the
      // network injector's latency/error/garbage modes apply.
      const res = await fetch('/api/user/1');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed: User = corruptData(await res.json());
      // Validate like a real app would — graceful degradation demo.
      if (!parsed?.name || typeof parsed.name !== 'string' || !parsed.email?.includes('@')) {
        setPhase('corrupted');
        setUser(parsed ?? null);
        return;
      }
      setUser(parsed);
      setPhase('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">User Profile</h2>
        <button
          className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          Refetch
        </button>
      </header>

      {phase === 'loading' && <Skeleton />}

      {phase === 'error' && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Failed to load profile</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      )}

      {phase === 'corrupted' && (
        <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold">⚠️ Data looked corrupted — degraded view shown</p>
          <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      {phase === 'ok' && user && (
        <div className="flex items-center gap-4">
          <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full bg-slate-200" />
          <div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-sm text-slate-500">{user.city}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-14 w-14 rounded-full bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-28 rounded bg-slate-200" />
      </div>
    </div>
  );
}
