# 🐒 chaos on front

Chaos Monkey for the frontend. Randomly injects **network delays, API errors, garbage responses, corrupted data, and component crashes** into your React app during development — so you find out your UI breaks *before* your users do.

100% browser-side. No backend. Built for React 18 + TypeScript + Vite.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll see the demo app (User Profile + Dashboard) and the floating monkey control panel (bottom-right, dev-only).

Flip the **Master switch**, hit **Refetch**, and watch the app degrade gracefully. Try the presets:

- 🐢 **Latency storm** — every request crawls (2–8s). Do your spinners/skeletons hold up?
- 🌧️ **Error rain** — requests fail with 500/503/403/408. Are your error states real UI or white screens?
- ☢️ **Corrupt everything** — API payloads get nulled, mistyped, and gutted.

## Using the library in another project

### What your app needs

- **React 18+** (functional components)
- **zustand ≥ 5** — peer dependency; the chaos store and panel are built on it
- **Tailwind is optional** — only the `ChaosControlPanel` UI uses it. The injectors, provider, and programmatic API work in any React app without Tailwind
- **fetch-based networking** — the network injector patches `window.fetch`. Requests made through XHR or axios's default adapter are not intercepted (yet)

### Option 1: Copy the source (works today)

The package isn't on npm yet, so the fastest path is copying the library folder:

1. Copy `src/lib/` from this repo into your project (e.g. `your-app/src/lib/`).
2. Install the peer dependency: `npm install zustand`.
3. Add Tailwind **only if** you want the built-in control panel. Skip it if you'll drive chaos from your own dev toolbar.

Then wire it up at your app's root:

```tsx
import { ChaosProvider, ChaosControlPanel } from './lib';

function App() {
  return (
    <>
      <ChaosProvider>
        <YourApp />
      </ChaosProvider>
      {/* Dev-only: the panel is for humans, not production */}
      {import.meta.env.DEV && <ChaosControlPanel />}
    </>
  );
}
```

`ChaosProvider` mounts the chaos engine (interval-driven ticks) and installs the network injector (a `window.fetch` wrapper). It also provides a default error boundary so injected crashes render a resettable fallback instead of nuking the page — pass `fallback={<YourFallback />}` for your own.

### Programmatic API

```ts
import { corruptData, withChaos, useChaosCrash, useChaos, unleashNow } from './lib';

corruptData(apiResponse);          // randomly nulls/ deletes/ mistypes fields
const Risky = withChaos(MyComp);   // may randomly throw during render
function Widget() { useChaosCrash('Widget'); ... }  // same, as a hook
useChaos();                        // full Zustand store access
unleashNow();                      // fire one chaos probe immediately
```

### Option 2: Install from npm (after publishing)

This repo is already set up for publishing — `npm run build:lib` produces `dist-lib/` with ESM + CJS + TypeScript declarations, and `package.json` has the `exports`/`types`/`peerDependencies` fields wired. Once it's published, the setup becomes:

```bash
npm install -D chaos-on-front zustand
```

```tsx
import { ChaosProvider, ChaosControlPanel } from 'chaos-on-front';
```

A dev-only install is appropriate — neither the provider nor the panel should be mounted in production builds.

### Driving chaos from code

Skip the panel entirely and control everything programmatically — useful for a "chaos mode" toggle in your own dev toolbar or Storybook:

```ts
import { useChaosStore } from './lib';

useChaosStore.getState().setEnabled(true);
useChaosStore.getState().applyPreset('latency-storm');
```

### How the network injector decides

Per request (after any URL filter matches), one mode wins a weighted roll: **latency** (sleep 1–4s, then pass through), **error** (real HTTP failure status), or **garbage** (200 OK with junk in the body). All knobs are in the panel.

### Architecture

```text
src/lib/
  core/
    store.ts     # Zustand: config, presets, event log
    engine.ts    # interval-driven chaos ticks
    random.ts    # dice helpers
  injectors/
    networkInjector.ts    # window.fetch monkey-patch (install/restore)
    dataInjector.ts       # corruptData()
    componentInjector.tsx # withChaos / useChaosCrash
  components/
    ChaosProvider.tsx     # provider + error boundary + useChaos
    ChaosControlPanel.tsx # Tailwind floating dev panel
  index.ts      # public exports
```

## Tests

```bash
npm test   # Vitest: 30 tests across core, injectors, store, and React components
```

## Publishing (later)

`npm run build:lib` compiles `src/lib` into `dist-lib/` (ESM + CJS + `.d.ts`, react/zustand externalized) and the `exports`/`types`/`peerDependencies` fields are already wired in `package.json` — it's ready for `npm publish` whenever you want to split it into its own package.

## Notes & caveats

- **Dev tool only.** Don't ship it to production — gate the panel with `import.meta.env.DEV` and don't mount `ChaosProvider` in prod builds.
- The network injector targets **`fetch` only** for now (XHR support is a possible follow-up).
- The engine drives data/component chaos on ticks; network chaos is per-request. The event log shows everything either way.
- HMR-safe: the fetch patch keeps a pristine reference and restores it on unmount.
