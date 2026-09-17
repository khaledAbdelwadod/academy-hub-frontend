/** Guards /teams so only that academy's active manager or admin can reach it. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { TeamsPage } from "./TeamsPage";

export function TeamsRoute(): ReactElement {
  const membership = useAcademyMembership();

  if (membership.status === "loading" || membership.status === "not-applicable") {
    return <div className="min-h-full" />;
  }

  if (membership.status === "error") {
    return <Navigate to="/myaccount/home" replace />;
  }

  const { roles } = membership.membership;
  if (!roles.includes("manager") && !roles.includes("admin")) {
    return <Navigate to="/myaccount/home" replace />;
  }

  return <TeamsPage />;
}
