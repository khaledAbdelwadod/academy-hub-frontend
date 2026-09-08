/** Guards /users so only a superadmin can reach the Users page. */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../state/AuthContext";
import { UsersPage } from "./UsersPage";

export function UsersRoute(): ReactElement {
  const { user } = useAuth();
  if (!user?.is_superuser) {
    return <Navigate to="/myaccount/home" replace />;
  }
  return <UsersPage />;
}
