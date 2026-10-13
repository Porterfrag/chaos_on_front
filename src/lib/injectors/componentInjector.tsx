import { type ComponentType } from 'react';
import { useChaosStore } from '../core/store';
import { chance } from '../core/random';

/**
 * Throws when the component injector decides the component should crash.
 * Wrap in an error boundary (e.g. <ChaosErrorBoundary>) to observe the
 * fallout. The dice are rolled on every render while chaos is enabled;
 * the event log is written asynchronously to avoid store updates during
 * the render phase.
 */
export function useChaosCrash(componentName: string): void {
  const { config } = useChaosStore.getState();
  if (config.enabled && config.component.enabled && chance(config.component.crashChance)) {
    const log = useChaosStore.getState().addEvent;
    setTimeout(() => log({ injector: 'component', message: `Crashed <${componentName}> during render` }), 0);
    throw new Error(`chaos_on_front: simulated crash in <${componentName}>`);
  }
}

/**
 * Wraps a component so it may randomly throw during render while chaos is
 * enabled. The thrown error must be caught by an error boundary above it.
 */
export function withChaos<P extends object>(Component: ComponentType<P>, name?: string): ComponentType<P> {
  const componentName = name ?? Component.displayName ?? Component.name ?? 'Anonymous';
  const Wrapped = (props: P) => {
    useChaosCrash(componentName);
    return <Component {...props} />;
  };
  Wrapped.displayName = `withChaos(${componentName})`;
  return Wrapped;
}
