import * as React from 'react';
import { useEffect, type ErrorInfo, type ReactNode } from 'react';
import { useChaosStore, type ChaosState } from '../core/store';
import { useChaosEngine } from '../core/engine';
import { installNetworkInjector } from '../injectors/networkInjector';

/**
 * Mounts the chaos engine and the network injector for the subtree's
 * lifetime. Wraps children in a default error boundary so component
 * crashes don't take down the whole app — pass your own `fallback` or
 * use your own boundaries for graceful-degradation demos.
 */
export function ChaosProvider({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  useChaosEngine();

  useEffect(() => installNetworkInjector(), []);

  return <ChaosErrorBoundary fallback={fallback}>{children}</ChaosErrorBoundary>;
}

interface BoundaryState {
  error: Error | null;
}

/** Minimal error boundary that renders a fallback when chaos (or anything) crashes a child. */
export class ChaosErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    useChaosStore.getState().addEvent({
      injector: 'component',
      message: 'Error boundary caught a crash',
      detail: `${error.message} | ${info.componentStack?.split('\n')[1]?.trim() ?? ''}`,
    });
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">💥 Something crashed (gracefully).</p>
            <p className="mt-1 text-sm opacity-80">{this.state.error.message}</p>
            <button
              className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => this.setState({ error: null })}
            >
              Reset boundary
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/** Hook for programmatic access to the chaos store. */
export function useChaos(): ChaosState {
  return useChaosStore();
}
