/** Guards /academies so only a superadmin can reach the Academies page. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../state/AuthContext";
import { AcademiesPage } from "./AcademiesPage";

export function AcademiesRoute(): ReactElement {
  const { user } = useAuth();
  if (!user?.is_superuser) {
    return <Navigate to="/home" replace />;
  }
  return <AcademiesPage />;
}
