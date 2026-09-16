/** A modal for an academy manager to add, edit, and remove their academy's branches. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { Branch } from "../../api/branchApi";
import { createBranch, deleteBranch, listBranches, updateBranch } from "../../api/branchApi";
import { ModalShell } from "../ui/ModalShell";
import { BranchManager } from "./BranchManager";

interface BranchBuilderModalProps {
  subdomain: string;
  onClose: () => void;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; branches: Branch[] };

export function BranchBuilderModal({ subdomain, onClose }: BranchBuilderModalProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  function reload(): void {
    listBranches(subdomain)
      .then((branches) => setState({ status: "ready", branches }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load branches.";
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  return (
    <ModalShell title="Branches" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/60">Manage every location your academy trains at.</p>

        {state.status === "loading" && <p className="text-sm text-gray-500">Loading…</p>}
        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        {state.status === "ready" && (
          <BranchManager
            branches={state.branches}
            onAdd={(data) => createBranch(subdomain, data)}
            onUpdate={(id, data) => updateBranch(subdomain, id, data)}
            onDelete={(id) => deleteBranch(subdomain, id)}
            onChanged={reload}
          />
        )}
      </div>
    </ModalShell>
  );
}
