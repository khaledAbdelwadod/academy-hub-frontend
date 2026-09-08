/** Whether the signed-in user is an active member of the academy on the current subdomain. */

import { useEffect, useState } from "react";

import type { MyMembership } from "../api/membershipApi";
import { fetchMyMembership } from "../api/membershipApi";
import { getAcademySubdomain } from "../utils/subdomain";

export type AcademyMembershipState =
  | { status: "not-applicable" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; membership: MyMembership };

/**
 * Check the current user's membership at the academy on this subdomain, if any.
 *
 * @returns "not-applicable" when not on an academy subdomain (e.g. www), otherwise
 * the loading/error/ready status of the membership check.
 */
export function useAcademyMembership(): AcademyMembershipState {
  const [state, setState] = useState<AcademyMembershipState>(() =>
    getAcademySubdomain() ? { status: "loading" } : { status: "not-applicable" },
  );

  useEffect(() => {
    const subdomain = getAcademySubdomain();
    if (!subdomain) {
      return;
    }
    fetchMyMembership(subdomain)
      .then((membership) => setState({ status: "ready", membership }))
      .catch(() => setState({ status: "error" }));
  }, []);

  return state;
}
