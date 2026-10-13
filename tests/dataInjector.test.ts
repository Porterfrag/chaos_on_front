import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { corruptData } from '../src/lib/injectors/dataInjector';
import { useChaosStore } from '../src/lib/core/store';

const setState = useChaosStore.setState;
const baseConfig = useChaosStore.getState().config;

beforeEach(() => {
  setState({
    config: {
      ...baseConfig,
      enabled: true,
      data: { enabled: true, corruptChance: 1 },
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  setState({ config: baseConfig });
});

describe('corruptData', () => {
  it('returns data unchanged when chaos is disabled', () => {
    setState({ config: { ...baseConfig, enabled: false, data: { enabled: true, corruptChance: 1 } } });
    const data = { name: 'Ada', city: 'London' };
    expect(corruptData(data)).toBe(data);
  });

  it('returns data unchanged when the dice say no', () => {
    setState({ config: { ...baseConfig, data: { enabled: true, corruptChance: 0 } } });
    const data = { name: 'Ada' };
    expect(corruptData(data)).toBe(data);
  });

  it('deletes a field when the delete branch wins', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // chance(0.5) passes, first key picked
    const result = corruptData({ name: 'Ada', city: 'London' }) as Record<string, unknown>;
    expect('name' in result).toBe(false);
    expect(result.city).toBe('London');
  });

  it('mangles a field value when the mangle branch wins', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75); // chance(0.5) fails -> mangle; scalar roll 0.75 -> options[2]
    const result = corruptData({ name: 'Ada' }) as Record<string, unknown>;
    expect(result).not.toEqual({ name: 'Ada' });
    expect(Object.keys(result)).toContain('name');
  });

  it('corrupts array elements in place', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // element 0, then scalar corruption -> null
    const result = corruptData(['a', 'b']) as unknown[];
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBe('b');
  });

  it('logs a chaos event when corruption fires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const before = useChaosStore.getState().events.length;
    corruptData({ a: 1 });
    expect(useChaosStore.getState().events.length).toBe(before + 1);
    expect(useChaosStore.getState().events[0].injector).toBe('data');
  });
});
