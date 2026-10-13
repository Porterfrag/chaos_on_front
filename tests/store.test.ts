import { describe, expect, it, beforeEach } from 'vitest';
import { useChaosStore, presets } from '../src/lib/core/store';

beforeEach(() => {
  useChaosStore.setState({ config: useChaosStore.getState().config, events: [] });
});

describe('chaos store', () => {
  it('starts disabled with defaults', () => {
    expect(useChaosStore.getState().config.enabled).toBe(false);
  });

  it('toggling the master switch flips config.enabled', () => {
    useChaosStore.getState().setEnabled(true);
    expect(useChaosStore.getState().config.enabled).toBe(true);
    useChaosStore.getState().setEnabled(false);
    expect(useChaosStore.getState().config.enabled).toBe(false);
  });

  it('applies presets atomically', () => {
    useChaosStore.getState().applyPreset('latency-storm');
    const config = useChaosStore.getState().config;
    expect(config).toEqual(presets['latency-storm']);
    expect(config.network.latencyChance).toBe(0.9);
  });

  it('adds and caps the event log at 100 entries', () => {
    const { addEvent } = useChaosStore.getState();
    for (let i = 0; i < 120; i++) {
      addEvent({ injector: 'network', message: `event ${i}` });
    }
    const events = useChaosStore.getState().events;
    expect(events).toHaveLength(100);
    // Newest first.
    expect(events[0].message).toBe('event 119');
  });

  it('clears the event log', () => {
    useChaosStore.getState().addEvent({ injector: 'data', message: 'x' });
    useChaosStore.getState().clearEvents();
    expect(useChaosStore.getState().events).toHaveLength(0);
  });
});
