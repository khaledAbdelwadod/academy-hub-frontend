import type { ReactElement } from "react";

import { HealthStatus } from "./components/HealthStatus";

export function App(): ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-semibold text-slate-900">Academy Hub</h1>
        <HealthStatus />
      </div>
    </main>
  );
}
