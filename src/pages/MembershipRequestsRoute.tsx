/** Guards /membership-requests so only that academy's active manager can reach it. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { MembershipRequestsPage } from "./MembershipRequestsPage";

export function MembershipRequestsRoute(): ReactElement {
  const membership = useAcademyMembership();

  if (membership.status === "loading" || membership.status === "not-applicable") {
    return <div className="min-h-full" />;
  }

  if (membership.status === "error" || !membership.membership.roles.includes("manager")) {
    return <Navigate to="/myaccount/home" replace />;
  }

  return <MembershipRequestsPage />;
}
