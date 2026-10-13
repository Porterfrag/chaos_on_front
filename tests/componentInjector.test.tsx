// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { withChaos, useChaosCrash } from '../src/lib/injectors/componentInjector';
import { ChaosErrorBoundary } from '../src/lib/components/ChaosProvider';
import { useChaosStore } from '../src/lib/core/store';

const setState = useChaosStore.setState;
const baseConfig = useChaosStore.getState().config;

function Sample() {
  return <div>sample content</div>;
}

beforeEach(() => {
  useChaosStore.getState().clearEvents();
  setState({
    config: {
      ...baseConfig,
      enabled: true,
      component: { enabled: true, crashChance: 1 },
    },
  });
});

afterEach(() => {
  cleanup();
  setState({ config: baseConfig });
});

describe('componentInjector', () => {
  it('withChaos-wrapped component crashes into the error boundary fallback', () => {
    const Risky = withChaos(Sample);
    render(
      <ChaosErrorBoundary>
        <Risky />
      </ChaosErrorBoundary>,
    );
    // Default fallback renders, original content does not.
    expect(screen.getByText(/Something crashed/i)).toBeDefined();
    expect(screen.queryByText('sample content')).toBeNull();
    // The crash was logged.
    expect(useChaosStore.getState().events[0].injector).toBe('component');
  });

  it('boundary reset button brings the subtree back', () => {
    const Risky = withChaos(Sample);
    render(
      <ChaosErrorBoundary>
        <Risky />
      </ChaosErrorBoundary>,
    );
    // Disable chaos, then reset the boundary — the child renders fine now.
    setState({ config: { ...baseConfig, enabled: false } });
    fireEvent.click(screen.getByRole('button', { name: /reset boundary/i }));
    expect(screen.getByText('sample content')).toBeDefined();
  });

  it('does not crash when chaos is disabled', () => {
    setState({ config: { ...baseConfig, enabled: false } });
    const Risky = withChaos(Sample);
    render(
      <ChaosErrorBoundary>
        <Risky />
      </ChaosErrorBoundary>,
    );
    expect(screen.getByText('sample content')).toBeDefined();
    expect(useChaosStore.getState().events).toHaveLength(0);
  });

  it('useChaosCrash throws when the dice say so', () => {
    function Probe() {
      useChaosCrash('Probe');
      return <div>probe ok</div>;
    }
    render(
      <ChaosErrorBoundary>
        <Probe />
      </ChaosErrorBoundary>,
    );
    expect(screen.queryByText('probe ok')).toBeNull();
    // The boundary logs first (synchronously), including the error message in its detail.
    const logged = useChaosStore
      .getState()
      .events.map((e) => `${e.message} ${e.detail ?? ''}`)
      .join(' | ');
    expect(logged).toContain('Error boundary caught a crash');
    expect(logged).toContain('<Probe>');
  });

  it('wrapped component keeps working with crashChance 0', () => {
    setState({ config: { ...baseConfig, component: { enabled: true, crashChance: 0 } } });
    const Risky = withChaos(Sample);
    render(
      <ChaosErrorBoundary>
        <Risky />
      </ChaosErrorBoundary>,
    );
    expect(screen.getByText('sample content')).toBeDefined();
  });

  it('sets a displayName on the wrapped component', () => {
    const Risky = withChaos(Sample);
    expect(Risky.displayName).toBe('withChaos(Sample)');
  });
});
