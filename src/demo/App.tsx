import { ChaosControlPanel, ChaosErrorBoundary, ChaosProvider } from '../lib';
import { OrderList } from './components/OrderList';
import { ProductsPanel } from './components/ProductsPanel';
import { SummaryCards } from './components/SummaryCards';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🐒 Sprocket &amp; Sons — admin</h1>
            <p className="text-sm text-slate-400">
              Open the monkey panel (bottom-right), flip the master switch, and watch this app degrade gracefully.
            </p>
          </div>
          <div className="hidden text-xs text-slate-500 sm:block">chaos-on-front demo</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-6">
        <ChaosProvider>
          <ChaosErrorBoundary fallback={<PanelErrorFallback label="Top row" />}>
            <SummaryCards />
          </ChaosErrorBoundary>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChaosErrorBoundary fallback={<PanelErrorFallback label="Products" />}>
                <ProductsPanel />
              </ChaosErrorBoundary>
            </div>
            <div>
              <ChaosErrorBoundary fallback={<PanelErrorFallback label="Orders" />}>
                <OrderList />
              </ChaosErrorBoundary>
            </div>
          </div>
        </ChaosProvider>
      </main>

      {import.meta.env.DEV && <ChaosControlPanel />}
    </div>
  );
}

function PanelErrorFallback({ label }: { label: string }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
      <p className="font-semibold">💥 {label} crashed.</p>
      <p className="mt-1 text-xs opacity-80">A chaos-induced render error was caught by the boundary above this panel.</p>
    </section>
  );
}
