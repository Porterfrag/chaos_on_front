import { useChaosStore } from '../core/store';
import { chance } from '../core/random';

/** Wrong-type / garbage replacements used when a string field is corrupted. */
const STRING_CORRUPTIONS: unknown[] = [null, undefined, '', 'Nan', 'null', '‎', 42];

/**
 * Corrupts a value according to the data injector config. Returns one of:
 * the value unchanged, null/undefined, a wrong-typed replacement, or the
 * value with a random field deleted (for objects) / an element nulled
 * (for arrays).
 */
export function corruptData<T>(data: T): T {
  const { config } = useChaosStore.getState();
  const { data: dataConfig } = config;

  if (!config.enabled || !dataConfig.enabled || !chance(dataConfig.corruptChance)) {
    return data;
  }

  const log = useChaosStore.getState().addEvent;
  const corrupted = corruptValue(data) as T;
  log({
    injector: 'data',
    message: 'Corrupted a data payload',
    detail: summarize(corrupted),
  });
  return corrupted;
}

function corruptValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return value;
    const copy = [...value];
    const index = Math.floor(Math.random() * copy.length);
    copy[index] = corruptValue(copy[index]);
    return copy;
  }
  if (typeof value === 'object') {
    return corruptObject(value as Record<string, unknown>);
  }
  return pickScalarCorruption(value);
}

function corruptObject(obj: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(obj);
  if (keys.length === 0) return obj;

  if (chance(0.5)) {
    // Delete a random field.
    const copy = { ...obj };
    const victim = keys[Math.floor(Math.random() * keys.length)];
    delete copy[victim];
    return copy;
  }
  // Mangle a random field's value.
  const copy = { ...obj };
  const victim = keys[Math.floor(Math.random() * keys.length)];
  copy[victim] = corruptValue(copy[victim]);
  return copy;
}

function pickScalarCorruption(value: unknown): unknown {
  switch (typeof value) {
    case 'string':
      return STRING_CORRUPTIONS[Math.floor(Math.random() * STRING_CORRUPTIONS.length)];
    case 'number':
      return chance(0.5) ? NaN : 'not-a-number';
    case 'boolean':
      return chance(0.5) ? null : 'yes';
    default:
      return null;
  }
}

function summarize(value: unknown): string {
  try {
    return JSON.stringify(value)?.slice(0, 80) ?? 'undefined';
  } catch {
    return '[unserializable]';
  }
}
