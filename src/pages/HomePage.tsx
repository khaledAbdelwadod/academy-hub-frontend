/** The signed-in "Home" landing content, rendered inside AppShell at /home. */

import type { ReactElement } from "react";

export function HomePage(): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-white/60">Home — coming soon.</p>
    </div>
  );
}
