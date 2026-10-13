import { describe, expect, it, vi, afterEach } from 'vitest';
import { chance, randomInRange, weightedPick } from '../src/lib/core/random';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomInRange', () => {
  it('stays within [min, max]', () => {
    for (let i = 0; i < 500; i++) {
      const v = randomInRange(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('returns min when max equals min', () => {
    expect(randomInRange(5, 5)).toBe(5);
  });
});

describe('chance', () => {
  it('always passes with probability 1 and never with 0', () => {
    expect(chance(1)).toBe(true);
    expect(chance(0)).toBe(false);
  });

  it('passes when the roll is below the probability', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    expect(chance(0.5)).toBe(true);
    expect(chance(0.3)).toBe(false);
  });
});

describe('weightedPick', () => {
  it('returns the only mode when its weight is 1', () => {
    expect(weightedPick({ latency: 1, error: 0, garbage: 0 })).toBe('latency');
  });

  it('splits by cumulative weight', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    expect(weightedPick({ latency: 0.1, error: 0.7, garbage: 0.2 })).toBe('latency');
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(weightedPick({ latency: 0.1, error: 0.7, garbage: 0.2 })).toBe('error');
    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    expect(weightedPick({ latency: 0.1, error: 0.7, garbage: 0.2 })).toBe('garbage');
  });

  it('returns null when all weights are zero', () => {
    expect(weightedPick({ latency: 0, error: 0, garbage: 0 })).toBeNull();
  });
});
