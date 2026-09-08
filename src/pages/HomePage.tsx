/**
 * The signed-in "Home" landing content, rendered inside AppShell at /myaccount/home.
 *
 * Account home is a www-only concept (cross-academy aggregation + academy
 * picker, per the multi-tenancy decision) - it has no meaning on an academy
 * subdomain. A user who isn't a member there yet gets a placeholder instead;
 * the real "not a member, request to join" screen is still to be built.
 */

import type { ReactElement } from "react";

import { getAcademySubdomain } from "../utils/subdomain";

export function HomePage(): ReactElement {
  if (getAcademySubdomain()) {
    return <div className="min-h-[60vh]" />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-white/60">Home — coming soon.</p>
    </div>
  );
}
