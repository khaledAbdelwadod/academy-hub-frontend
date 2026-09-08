/**
 * The signed-in "Home" landing content, rendered inside AppShell at /myaccount/home.
 *
 * Account home is a www-only concept (cross-academy aggregation + academy
 * picker, per the multi-tenancy decision) - on an academy subdomain this same
 * route instead shows that academy's status for the current user: a "coming
 * soon" placeholder for an active member (the real per-role dashboard isn't
 * built yet), or a "you're not a member here" screen otherwise. The
 * manager-configurable join-request form described for that second case is
 * still a separate, not-yet-built feature - this only shows the fallback
 * "contact the academy" version.
 */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { MyMembership } from "../api/membershipApi";
import { fetchMyMembership } from "../api/membershipApi";
import { getAcademySubdomain } from "../utils/subdomain";

type AcademyHomeState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; membership: MyMembership };

function AcademyHome(): ReactElement {
  const [state, setState] = useState<AcademyHomeState>({ status: "loading" });

  useEffect(() => {
    const subdomain = getAcademySubdomain();
    if (!subdomain) {
      return;
    }
    fetchMyMembership(subdomain)
      .then((membership) => setState({ status: "ready", membership }))
      .catch(() => setState({ status: "error" }));
  }, []);

  if (state.status === "loading") {
    return <div className="min-h-[60vh]" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-white/60">Could not load this page.</p>
      </div>
    );
  }

  const { membership } = state;

  if (membership.is_member) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-white/60">Welcome to {membership.academy_name} — dashboard coming soon.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-white/85">You are not a member of {membership.academy_name}.</p>
        <p className="mt-2 text-white/60">
          Please contact the academy admin
          {membership.academy_contact_phone && <> at {membership.academy_contact_phone}</>}.
        </p>
      </div>
    </div>
  );
}

export function HomePage(): ReactElement {
  if (getAcademySubdomain()) {
    return <AcademyHome />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-white/60">Home — coming soon.</p>
    </div>
  );
}
