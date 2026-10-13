import { create } from 'zustand';

/** Identifies which chaos injector fired an event. */
export type InjectorId = 'network' | 'data' | 'component';

/** Mode of a network chaos event. */
export type NetworkMode = 'latency' | 'error' | 'garbage';

/** A single entry in the chaos event log, shown in the control panel. */
export interface ChaosEvent {
  id: number;
  timestamp: number;
  injector: InjectorId;
  /** Short human-readable description of what was done. */
  message: string;
  /** Optional detail, e.g. the URL attacked or the error thrown. */
  detail?: string;
}

export interface ChaosConfig {
  /** Global kill switch. Nothing fires while false. */
  enabled: boolean;
  /** How often (ms) the engine rolls the dice for an attack. */
  intervalMs: number;
  /** Probability (0-1) that a tick actually fires an attack. */
  attackChance: number;
  network: {
    enabled: boolean;
    /** Probability a matched request is delayed. */
    latencyChance: number;
    /** Probability a matched request fails with an HTTP error. */
    errorChance: number;
    /** Probability a matched request resolves with garbage data. */
    garbageChance: number;
    /** Artificial latency range in ms. */
    latencyMinMs: number;
    latencyMaxMs: number;
    /** Only attack URLs containing this substring. Empty = all requests. */
    urlFilter: string;
  };
  data: {
    enabled: boolean;
    /** Probability a corruptData() call actually corrupts. */
    corruptChance: number;
  };
  component: {
    enabled: boolean;
    /** Probability a withChaos-wrapped component throws on render. */
    crashChance: number;
  };
}

export const defaultConfig: ChaosConfig = {
  enabled: false,
  intervalMs: 5000,
  attackChance: 0.5,
  network: {
    enabled: true,
    latencyChance: 0.4,
    errorChance: 0.3,
    garbageChance: 0.15,
    latencyMinMs: 1000,
    latencyMaxMs: 4000,
    urlFilter: '',
  },
  data: {
    enabled: true,
    corruptChance: 0.5,
  },
  component: {
    enabled: true,
    crashChance: 0.2,
  },
};

export interface ChaosState {
  config: ChaosConfig;
  events: ChaosEvent[];
  addEvent: (event: Omit<ChaosEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  setEnabled: (enabled: boolean) => void;
  updateConfig: (patch: Partial<Omit<ChaosConfig, 'network' | 'data' | 'component'>>) => void;
  updateNetwork: (patch: Partial<ChaosConfig['network']>) => void;
  updateData: (patch: Partial<ChaosConfig['data']>) => void;
  updateComponent: (patch: Partial<ChaosConfig['component']>) => void;
  applyPreset: (preset: ChaosPreset) => void;
}

export type ChaosPreset = 'default' | 'latency-storm' | 'error-rain' | 'corrupt-everything';

export const presets: Record<ChaosPreset, ChaosConfig> = {
  default: defaultConfig,
  'latency-storm': {
    ...defaultConfig,
    enabled: true,
    attackChance: 0.8,
    network: { ...defaultConfig.network, latencyChance: 0.9, errorChance: 0.05, garbageChance: 0, latencyMinMs: 2000, latencyMaxMs: 8000 },
    data: { ...defaultConfig.data, corruptChance: 0 },
    component: { ...defaultConfig.component, crashChance: 0 },
  },
  'error-rain': {
    ...defaultConfig,
    enabled: true,
    attackChance: 0.7,
    network: { ...defaultConfig.network, latencyChance: 0.1, errorChance: 0.7, garbageChance: 0.1 },
    component: { ...defaultConfig.component, crashChance: 0.3 },
  },
  'corrupt-everything': {
    ...defaultConfig,
    enabled: true,
    attackChance: 0.9,
    network: { ...defaultConfig.network, latencyChance: 0.3, errorChance: 0.2, garbageChance: 0.5 },
    data: { ...defaultConfig.data, corruptChance: 0.9 },
    component: { ...defaultConfig.component, crashChance: 0.3 },
  },
};

const MAX_EVENTS = 100;
let nextEventId = 1;

/** Deep-clones a config so presets and defaults never share mutable references with live state. */
function cloneConfig(config: ChaosConfig): ChaosConfig {
  return {
    ...config,
    network: { ...config.network },
    data: { ...config.data },
    component: { ...config.component },
  };
}

export const useChaosStore = create<ChaosState>((set) => ({
  config: cloneConfig(defaultConfig),
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [{ ...event, id: nextEventId++, timestamp: Date.now() }, ...state.events].slice(0, MAX_EVENTS),
    })),
  clearEvents: () => set({ events: [] }),
  setEnabled: (enabled) => set((state) => ({ config: { ...state.config, enabled } })),
  updateConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  updateNetwork: (patch) => set((state) => ({ config: { ...state.config, network: { ...state.config.network, ...patch } } })),
  updateData: (patch) => set((state) => ({ config: { ...state.config, data: { ...state.config.data, ...patch } } })),
  updateComponent: (patch) =>
    set((state) => ({ config: { ...state.config, component: { ...state.config.component, ...patch } } })),
  applyPreset: (preset) => set({ config: cloneConfig(presets[preset]) }),
}));
