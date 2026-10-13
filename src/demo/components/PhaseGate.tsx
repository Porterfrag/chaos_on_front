import type { ReactNode } from 'react';
import type { Phase } from '../types';

interface Props {
  phase: Phase;
  /** Optional raw payload to show when phase === 'partial'. */
  partialPayload?: unknown;
  /** Optional detail to show on the error panel. */
  errorDetail?: string;
  retry?: () => void;
  /** Element to render when phase === 'loading'. */
  loading: ReactNode;
  /** Element to render when phase === 'empty'. */
  empty: ReactNode;
  /** Element to render when phase === 'ok' (the happy path). */
  children: ReactNode;
  /** Optional label for the error/partial panels. */
  label?: string;
}

/**
 * Renders one of five states uniformly across all widgets. The point: every
 * chaos mode (latency, error, garbage, corruption, empty result) has a real
 * visual path here, so the demo shows what "graceful degradation" actually
 * looks like in practice — not just loading + error.
 */
export function PhaseGate({ phase, partialPayload, errorDetail, retry, loading, empty, children, label }: Props) {
  if (phase === 'loading') return <>{loading}</>;
  if (phase === 'error') return <ErrorPanel label={label} detail={errorDetail} retry={retry} />;
  if (phase === 'partial') return <PartialPanel label={label} payload={partialPayload} retry={retry} />;
  if (phase === 'empty') return <>{empty}</>;
  return <>{children}</>;
}

function ErrorPanel({ label, detail, retry }: { label?: string; detail?: string; retry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" data-testid="phase-error">
      <p className="font-semibold">{label ? `${label} failed to load` : 'Failed to load'}</p>
      {detail && <p className="mt-1 opacity-80">{detail}</p>}
      {retry && (
        <button
          className="mt-3 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          onClick={retry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

function PartialPanel({ label, payload, retry }: { label?: string; payload?: unknown; retry?: () => void }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="phase-partial">
      <p className="font-semibold">⚠️ {label ? `${label} data looked corrupt` : 'Data looked corrupt'}</p>
      <p className="mt-1 text-xs opacity-80">Showing the raw payload so you can see what chaos did.</p>
      <pre className="mt-2 max-h-40 overflow-auto rounded bg-amber-100/60 p-2 text-xs">
        {safeStringify(payload)}
      </pre>
      {retry && (
        <button
          className="mt-3 rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          onClick={retry}
        >
          Refetch
        </button>
      )}
    </div>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? 'undefined';
  } catch {
    return '[unserializable]';
  }
}
