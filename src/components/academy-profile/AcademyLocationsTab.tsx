/** The Academy Profile "Locations" tab: the academy's main location plus any additional branches. */

import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { Branch } from "../../api/branchApi";
import { listBranches } from "../../api/branchApi";
import type { ManagerAcademyProfile } from "../../api/managerAcademyApi";
import { logger } from "../../utils/logger";
import { BranchBuilderModal } from "../admin/BranchBuilderModal";
import { SmallButton } from "../ui/SmallButton";

interface AcademyLocationsTabProps {
  subdomain: string;
  profile: ManagerAcademyProfile;
}

function locationCountLabel(total: number): string {
  return total > 0 ? `${total} location${total === 1 ? "" : "s"}` : "None";
}

function MainLocation({ profile }: { profile: ManagerAcademyProfile }): ReactElement {
  if (!profile.address) {
    return <p className="mt-1 text-sm text-black/60">Not set yet - a superadmin sets this when creating the academy.</p>;
  }

  return (
    <div className="mt-1 flex items-start gap-2 text-sm text-black/80">
      <span className="mt-0.5 text-mint">•</span>
      <span>
        {profile.address}
        {profile.google_maps_url && (
          <>
            {" "}
            <a href={profile.google_maps_url} target="_blank" rel="noreferrer" className="text-xs text-mint underline">
              View on map
            </a>
          </>
        )}
      </span>
    </div>
  );
}

function BranchList({ branches }: { branches: Branch[] | null }): ReactElement {
  if (branches === null) return <p className="mt-1 text-sm text-black/60">Loading…</p>;
  if (branches.length === 0) {
    return <p className="mt-1 text-sm text-black/60">None yet - add another training location below.</p>;
  }

  return (
    <ul className="mt-1 flex flex-col gap-1.5">
      {branches.map((branch) => (
        <li key={branch.id} className="flex items-start gap-2 text-sm text-black/80">
          <span className="mt-0.5 text-mint">•</span>
          <span>
            {branch.name}
            {branch.address && <span className="ml-1.5 text-xs text-black/40">{branch.address}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AcademyLocationsTab({ subdomain, profile }: AcademyLocationsTabProps): ReactElement {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const reloadBranches = useCallback(() => {
    listBranches(subdomain)
      .then(setBranches)
      .catch((error: unknown) => {
        logger.error("Failed to load branches", { error: error instanceof Error ? error.message : error });
      });
  }, [subdomain]);

  useEffect(() => {
    reloadBranches();
  }, [reloadBranches]);

  const total = (branches?.length ?? 0) + (profile.address ? 1 : 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-black">Locations</h2>
        {branches !== null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
              total > 0 ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
            }`}
          >
            {locationCountLabel(total)}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/50">Main location</p>
      <MainLocation profile={profile} />

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-black/50">Additional locations</p>
      <BranchList branches={branches} />

      <SmallButton variant="primary" onClick={() => setShowBuilder(true)} className="mt-4">
        Add location
      </SmallButton>

      {showBuilder && (
        <BranchBuilderModal
          subdomain={subdomain}
          onClose={() => {
            setShowBuilder(false);
            reloadBranches();
          }}
        />
      )}
    </div>
  );
}
