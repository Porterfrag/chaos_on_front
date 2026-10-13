// Demo-side fetch shim: serves /api/* locally so the demo has no backend,
// while still exercising the real fetch pipeline (and the chaos injector,
// which wraps this shim when ChaosProvider mounts).
import type { User } from './types';

const FAKE_USER: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  city: 'London',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ada',
};

const realFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/user/')) {
    return new Response(JSON.stringify(FAKE_USER), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/api/metrics')) {
    return new Response(JSON.stringify({ visits: 1284, signups: 97, revenue: 5123 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return realFetch(input, init);
};
