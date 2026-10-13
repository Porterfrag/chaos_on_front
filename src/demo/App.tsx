import { ChaosProvider, ChaosControlPanel } from '../lib';
import { UserProfile } from './components/UserProfile';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <h1 className="text-xl font-bold">🐒 chaos on front — demo</h1>
        <p className="text-sm text-slate-400">
          Open the monkey panel (bottom-right), flip the master switch, and watch this app degrade gracefully.
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <ChaosProvider>
          <UserProfile />
          <Dashboard />
          <StressButton />
        </ChaosProvider>
      </main>

      {import.meta.env.DEV && <ChaosControlPanel />}
    </div>
  );
}

/** Manually re-renders the dashboard repeatedly so crash dice get re-rolled fast. */
function StressButton() {
  return (
    <p className="text-center text-sm text-slate-500">
      Tip: hit <strong>Refetch</strong> in the profile and toggle chaos to see latency, error, garbage and
      corruption paths without waiting for the engine tick.
    </p>
  );
}
