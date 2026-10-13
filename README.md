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

> **Tailwind v4 users:** Tailwind does not scan `node_modules` by default, so the panel's classes won't be generated unless you register the package as a source. In your CSS entry file:
>
> ```css
> @import "tailwindcss";
> @source "../node_modules/chaos-on-front/dist-lib";
> ```
>
> (Path is relative to the CSS file — adjust if yours lives elsewhere, e.g. `../../node_modules/...`.) Without this, the panel still works but renders unstyled.

### Option 1: Install from npm (recommended)

```bash
npm install -D chaos-on-front zustand
```

A dev-only install is appropriate — neither the provider nor the panel should be mounted in production builds.

Then wire it up at your app's root:

```tsx
import { ChaosProvider, ChaosControlPanel } from 'chaos-on-front';

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
import { corruptData, withChaos, useChaosCrash, useChaos, unleashNow } from 'chaos-on-front';

corruptData(apiResponse);          // randomly nulls/ deletes/ mistypes fields
const Risky = withChaos(MyComp);   // may randomly throw during render
function Widget() { useChaosCrash('Widget'); ... }  // same, as a hook
useChaos();                        // full Zustand store access
unleashNow();                      // fire one chaos probe immediately
```

### Option 2: Copy the source

Prefer vendoring, or need to hack on the internals? Copy `src/lib/` from [the repo](https://github.com/Porterfrag/chaos_on_front) into your project (e.g. `your-app/src/lib/`), install the peer dependency (`npm install zustand`), and import from `./lib` instead of `'chaos-on-front'`. Add Tailwind **only if** you want the built-in control panel — skip it if you'll drive chaos from your own dev toolbar.

### Driving chaos from code

Skip the panel entirely and control everything programmatically — useful for a "chaos mode" toggle in your own dev toolbar or Storybook:

```ts
import { useChaosStore } from 'chaos-on-front';

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

## Releasing a new version (maintainers)

`npm run build:lib` compiles `src/lib` into `dist-lib/` (ESM + CJS + `.d.ts`, react/zustand externalized). Publishing is guarded by a `prepublishOnly` hook (`typecheck` + `build:lib`), so `npm publish` always ships a fresh build:

```bash
npm version patch   # or minor / major
npm publish
```

## Notes & caveats

- **Dev tool only.** Don't ship it to production — gate the panel with `import.meta.env.DEV` and don't mount `ChaosProvider` in prod builds.
- The network injector targets **`fetch` only** for now (XHR support is a possible follow-up).
- The engine drives data/component chaos on ticks; network chaos is per-request. The event log shows everything either way.
- HMR-safe: the fetch patch keeps a pristine reference and restores it on unmount.
