/** Guards /fees so only a superadmin can reach the Fees page. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../state/AuthContext";
import { FeesPage } from "./FeesPage";

export function FeesRoute(): ReactElement {
  const { user } = useAuth();
  if (!user?.is_superuser) {
    return <Navigate to="/myaccount/home" replace />;
  }
  return <FeesPage />;
}
