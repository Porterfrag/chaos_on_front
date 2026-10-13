import { useChaosStore } from '../core/store';
import { randomInRange, weightedPick } from '../core/random';

type OriginalFetch = typeof window.fetch;

const originalFetch: OriginalFetch = (...args) => window.__chaosOriginalFetch!(...args);

declare global {
  interface Window {
    /** Set once on install; always the pristine fetch. */
    __chaosOriginalFetch?: OriginalFetch;
  }
}

function shouldAttackUrl(url: string, filter: string): boolean {
  if (!filter) return true;
  return url.includes(filter);
}

type NetworkMode = 'latency' | 'error' | 'garbage';

function makeGarbage(): string {
  const shapes = [
    () => JSON.stringify({ chaos: true, reason: 'garbage injected by chaos_on_front' }),
    () => JSON.stringify([]),
    () => JSON.stringify({ data: null }),
    () => ',"not even json',
    () => 'undefined is not a function',
  ];
  return shapes[randomInRange(0, shapes.length - 1)]();
}

function statusTextFor(status: number): string {
  switch (status) {
    case 500:
      return 'Internal Server Error';
    case 503:
      return 'Service Unavailable';
    case 403:
      return 'Forbidden';
    case 408:
      return 'Request Timeout';
    default:
      return 'Chaos Error';
  }
}

/**
 * Patches window.fetch so requests are randomly delayed, failed, or filled
 * with garbage according to the network config. Returns an uninstall
 * function restoring the pristine fetch.
 */
export function installNetworkInjector(): () => void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return () => {};
  }
  // Keep a pristine copy even across HMR re-installs.
  if (!window.__chaosOriginalFetch) {
    window.__chaosOriginalFetch = window.fetch.bind(window);
  }

  const chaosFetch: OriginalFetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    const { network, enabled } = useChaosStore.getState().config;
    const log = useChaosStore.getState().addEvent;

    if (!enabled || !network.enabled || !shouldAttackUrl(url, network.urlFilter)) {
      return originalFetch(input, init);
    }

    // Latency / error / garbage are mutually exclusive per request.
    const mode = weightedPick<NetworkMode>({
      latency: network.latencyChance,
      error: network.errorChance,
      garbage: network.garbageChance,
    });

    switch (mode) {
      case 'latency': {
        const ms = randomInRange(network.latencyMinMs, network.latencyMaxMs);
        log({ injector: 'network', message: `Delayed ${shorten(url)} by ${ms}ms` });
        await sleep(ms);
        return originalFetch(input, init);
      }
      case 'error': {
        const status = [500, 503, 403, 408][randomInRange(0, 3)];
        log({ injector: 'network', message: `Failing ${shorten(url)} with ${status}`, detail: statusTextFor(status) });
        await sleep(randomInRange(50, 300));
        return new Response(null, { status, statusText: statusTextFor(status) });
      }
      case 'garbage': {
        const body = makeGarbage();
        log({ injector: 'network', message: `Returning garbage for ${shorten(url)}`, detail: body.slice(0, 80) });
        await sleep(randomInRange(50, 300));
        return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      default:
        return originalFetch(input, init);
    }
  };

  window.fetch = chaosFetch;
  return () => {
    if (window.__chaosOriginalFetch) {
      window.fetch = window.__chaosOriginalFetch;
      delete window.__chaosOriginalFetch;
    }
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shorten(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return url.slice(0, 60);
  }
}
