import { useEffect } from 'react';
import { useChaosStore, type InjectorId } from './store';
import { chance, randomInRange } from './random';
import { corruptData } from '../injectors/dataInjector';

/**
 * The chaos engine: on every tick, if chaos is enabled, it rolls the dice
 * and picks one of the enabled "active" injectors (data or component —
 * the network injector is passive, attacking real requests as they happen).
 */
export function useChaosEngine(): void {
  const config = useChaosStore((s) => s.config);

  useEffect(() => {
    if (!config.enabled) return;

    const timer = window.setInterval(() => {
      const state = useChaosStore.getState();
      const { enabled, attackChance } = state.config;
      if (!enabled || !chance(attackChance)) return;

      const active: InjectorId[] = [];
      if (state.config.data.enabled) active.push('data');
      if (state.config.component.enabled) active.push('component');
      if (active.length === 0) return;

      // Note: 'network' is intentionally excluded — it attacks per-request.
      const pick = active[randomInRange(0, active.length - 1)];
      if (pick === 'data') {
        corruptData({ tick: Date.now(), note: 'engine probe' });
      } else {
        fireComponentCrash();
      }
    }, config.intervalMs);

    return () => window.clearInterval(timer);
  }, [config.enabled, config.intervalMs, config.attackChance, config.data.enabled, config.component.enabled]);
}

/**
 * Engine-triggered component chaos is a log-only probe: the engine has no
 * component of its own to crash, and an async throw can never be caught by
 * a React error boundary — it would surface as an unhandled error instead
 * of the resettable fallback <ChaosErrorBoundary> provides. Real render
 * crashes come from withChaos / useChaosCrash on re-render.
 */
function fireComponentCrash(): void {
  const state = useChaosStore.getState();
  const { crashChance } = state.config.component;
  if (!chance(crashChance)) return;

  state.addEvent({ injector: 'component', message: 'Engine rolled a component crash probe' });
}

/** Manually rolls the dice once, ignoring the interval — "unleash now" button. */
export function unleashNow(): void {
  const state = useChaosStore.getState();
  if (!state.config.enabled) return;
  // Single log path: corruptData() logs when the dice say yes, stays silent otherwise.
  corruptData({ unleashedAt: new Date().toISOString(), note: 'manual unleash' });
}
