import { useState } from 'react';
import { useChaosStore, type ChaosPreset } from '../core/store';
import { unleashNow } from '../core/engine';

const PRESETS: { id: ChaosPreset; label: string }[] = [
  { id: 'latency-storm', label: '🐢 Latency storm' },
  { id: 'error-rain', label: '🌧️ Error rain' },
  { id: 'corrupt-everything', label: '☢️ Corrupt everything' },
];

const INJECTOR_ICON: Record<string, string> = {
  network: '🌐',
  data: '🧬',
  component: '💥',
};

/**
 * Floating dev-only control panel: master toggle, per-injector knobs,
 * preset buttons, manual unleash, and a live chaos event log.
 */
export function ChaosControlPanel() {
  const [open, setOpen] = useState(true);
  const config = useChaosStore((s) => s.config);
  const events = useChaosStore((s) => s.events);
  const setEnabled = useChaosStore((s) => s.setEnabled);
  const updateConfig = useChaosStore((s) => s.updateConfig);
  const updateNetwork = useChaosStore((s) => s.updateNetwork);
  const updateData = useChaosStore((s) => s.updateData);
  const updateComponent = useChaosStore((s) => s.updateComponent);
  const applyPreset = useChaosStore((s) => s.applyPreset);
  const clearEvents = useChaosStore((s) => s.clearEvents);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 font-mono text-xs text-slate-100">
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left font-sans text-sm font-semibold"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center gap-2">
            <span className={config.enabled ? 'animate-pulse' : ''}>🐒</span>
            chaos on front
          </span>
          <span className="text-slate-400">{open ? '▾' : '▴'}</span>
        </button>

        {open && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-slate-700 px-4 py-3">
            <Toggle
              label="Master switch"
              checked={config.enabled}
              onChange={setEnabled}
              highlight={config.enabled}
            />

            <section className="space-y-2">
              <Slider
                label="Tick interval"
                value={config.intervalMs}
                min={500}
                max={20000}
                step={500}
                format={(v) => `${v / 1000}s`}
                onChange={(intervalMs) => updateConfig({ intervalMs })}
              />
              <Slider
                label="Attack chance"
                value={config.attackChance}
                min={0}
                max={1}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(attackChance) => updateConfig({ attackChance })}
              />
            </section>

            <section className="space-y-2">
              <h3 className="font-sans font-semibold text-slate-300">Injectors</h3>
              <Toggle
                label="🌐 Network (fetch)"
                checked={config.network.enabled}
                onChange={(networkEnabled) => updateNetwork({ enabled: networkEnabled })}
              />
              {config.network.enabled && (
                <div className="space-y-2 rounded-lg bg-slate-800/60 p-2.5">
                  <Slider
                    label="Delay chance"
                    value={config.network.latencyChance}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(latencyChance) => updateNetwork({ latencyChance })}
                  />
                  <Slider
                    label="Error chance"
                    value={config.network.errorChance}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(errorChance) => updateNetwork({ errorChance })}
                  />
                  <Slider
                    label="Garbage chance"
                    value={config.network.garbageChance}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(garbageChance) => updateNetwork({ garbageChance })}
                  />
                  <Slider
                    label="Latency min"
                    value={config.network.latencyMinMs}
                    min={0}
                    max={10000}
                    step={250}
                    format={(v) => `${(v / 1000).toFixed(1)}s`}
                    onChange={(latencyMinMs) => updateNetwork({ latencyMinMs: Math.min(latencyMinMs, config.network.latencyMaxMs) })}
                  />
                  <Slider
                    label="Latency max"
                    value={config.network.latencyMaxMs}
                    min={0}
                    max={10000}
                    step={250}
                    format={(v) => `${(v / 1000).toFixed(1)}s`}
                    onChange={(latencyMaxMs) => updateNetwork({ latencyMaxMs: Math.max(latencyMaxMs, config.network.latencyMinMs) })}
                  />
                  <input
                    className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-200 placeholder-slate-500"
                    placeholder="URL filter (e.g. /api/)"
                    value={config.network.urlFilter}
                    onChange={(e) => updateNetwork({ urlFilter: e.target.value })}
                  />
                </div>
              )}
              <Toggle
                label="🧬 Data corruption"
                checked={config.data.enabled}
                onChange={(dataEnabled) => updateData({ enabled: dataEnabled })}
              />
              {config.data.enabled && (
                <div className="rounded-lg bg-slate-800/60 p-2.5">
                  <Slider
                    label="Corrupt chance"
                    value={config.data.corruptChance}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(corruptChance) => updateData({ corruptChance })}
                  />
                </div>
              )}
              <Toggle
                label="💥 Component crashes"
                checked={config.component.enabled}
                onChange={(componentEnabled) => updateComponent({ enabled: componentEnabled })}
              />
              {config.component.enabled && (
                <div className="rounded-lg bg-slate-800/60 p-2.5">
                  <Slider
                    label="Crash chance"
                    value={config.component.crashChance}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(crashChance) => updateComponent({ crashChance })}
                  />
                </div>
              )}
            </section>

            <section className="space-y-1.5">
              <h3 className="font-sans font-semibold text-slate-300">Presets</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className="rounded bg-slate-700 px-2 py-1.5 text-left font-sans font-medium hover:bg-slate-600"
                    onClick={() => applyPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                className="w-full rounded bg-red-600 px-2 py-1.5 font-sans font-semibold hover:bg-red-500 disabled:opacity-40"
                disabled={!config.enabled}
                onClick={unleashNow}
              >
                ⚡ Unleash now
              </button>
            </section>

            <section className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-semibold text-slate-300">Event log</h3>
                <button className="text-slate-400 hover:text-slate-200" onClick={clearEvents}>
                  clear
                </button>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-black/40 p-2">
                {events.length === 0 && <p className="text-slate-500">No chaos yet. Unleash the monkey.</p>}
                {events.map((e) => (
                  <div key={e.id} className="leading-snug" title={e.detail}>
                    <span className="text-slate-500">
                      {new Date(e.timestamp).toLocaleTimeString()}{' '}
                    </span>
                    <span>{INJECTOR_ICON[e.injector]} </span>
                    <span className="text-slate-200">{e.message}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function Toggle({
  label,
  checked,
  onChange,
  highlight,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  highlight?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-center justify-between rounded px-1 py-0.5 ${highlight ? 'bg-amber-500/20' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-red-500" />
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-slate-300">
        {label} <span className="text-slate-400">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-red-500"
      />
    </label>
  );
}
