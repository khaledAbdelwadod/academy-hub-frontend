/** Guards /memberships so only a superadmin can reach the Memberships page. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../state/AuthContext";
import { MembershipsPage } from "./MembershipsPage";

export function MembershipsRoute(): ReactElement {
  const { user } = useAuth();
  if (!user?.is_superuser) {
    return <Navigate to="/myaccount/home" replace />;
  }
  return <MembershipsPage />;
}
