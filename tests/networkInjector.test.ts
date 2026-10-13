// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { installNetworkInjector } from '../src/lib/injectors/networkInjector';
import { useChaosStore } from '../src/lib/core/store';

const setState = useChaosStore.setState;
const baseConfig = useChaosStore.getState().config;

/** Network config tuned so a given mode always wins the weighted roll. */
function networkWith(rollMode: 'latency' | 'error' | 'garbage') {
  return {
    ...baseConfig.network,
    enabled: true,
    latencyChance: rollMode === 'latency' ? 1 : 0,
    errorChance: rollMode === 'error' ? 1 : 0,
    garbageChance: rollMode === 'garbage' ? 1 : 0,
    latencyMinMs: 1000,
    latencyMaxMs: 1000,
    urlFilter: '',
  };
}

function enableChaos(network: ReturnType<typeof networkWith>) {
  setState({ config: { ...baseConfig, enabled: true, network } });
}

beforeEach(() => {
  // Stub the "real" fetch the injector wraps — jsdom has no network layer.
  window.fetch = vi.fn(() => Promise.resolve(new Response('passthrough')));
  useChaosStore.getState().clearEvents();
  enableChaos(networkWith('error'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setState({ config: baseConfig });
});

describe('networkInjector', () => {
  it('passes requests through untouched when chaos is disabled', async () => {
    setState({ config: { ...baseConfig, enabled: false, network: networkWith('error') } });
    const uninstall = installNetworkInjector();
    const res = await window.fetch('https://example.test/api/user');
    uninstall();
    expect(await res.text()).toBe('passthrough');
  });

  it('fails matching requests with an HTTP error status', async () => {
    const uninstall = installNetworkInjector();
    const res = await window.fetch('https://example.test/api/user');
    uninstall();
    expect([500, 503, 403, 408]).toContain(res.status);
    const events = useChaosStore.getState().events;
    expect(events[0].injector).toBe('network');
    expect(events[0].message).toContain('Failing');
  });

  it('returns garbage with a 200 status', async () => {
    enableChaos(networkWith('garbage'));
    const uninstall = installNetworkInjector();
    const res = await window.fetch('https://example.test/api/user');
    const text = await res.text();
    uninstall();
    expect(res.status).toBe(200);
    expect(text.length).toBeGreaterThan(0);
    expect(useChaosStore.getState().events[0].message).toContain('garbage');
  });

  it('delays matching requests by the configured latency', async () => {
    vi.useFakeTimers();
    enableChaos(networkWith('latency'));
    const uninstall = installNetworkInjector();
    const promise = window.fetch('https://example.test/api/user');
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    await promise;
    uninstall();
  });

  it('respects the URL filter', async () => {
    enableChaos({ ...networkWith('error'), urlFilter: '/api/' });
    const uninstall = installNetworkInjector();
    // Non-matching URL passes straight through to the stubbed fetch.
    const res = await window.fetch('https://example.test/other/thing');
    uninstall();
    expect(await res.text()).toBe('passthrough');
    expect(useChaosStore.getState().events).toHaveLength(0);
  });

  it('restores the original fetch on uninstall', async () => {
    const uninstall = installNetworkInjector();
    expect(window.__chaosOriginalFetch).toBeDefined();
    uninstall();
    expect(window.__chaosOriginalFetch).toBeUndefined();
    // Restored fetch still behaves like the stubbed pass-through.
    const res = await window.fetch('https://example.test/api/user');
    expect(await res.text()).toBe('passthrough');
  });
});
