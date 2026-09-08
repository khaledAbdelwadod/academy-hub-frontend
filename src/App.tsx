import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AcademiesRoute } from "./pages/AcademiesRoute";
import { AppShell } from "./pages/AppShell";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MembershipsRoute } from "./pages/MembershipsRoute";
import { UsersRoute } from "./pages/UsersRoute";
import { AuthProvider, useAuth } from "./state/AuthContext";

function LoginRoute(): ReactElement {
  const { user } = useAuth();
  return user ? <Navigate to="/myaccount/home" replace /> : <LoginPage />;
}

function AppRoutes(): ReactElement {
  const { sessionChecked, user } = useAuth();

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground">
        <p className="text-ink/60">Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<AppShell />}>
        <Route path="/myaccount/home" element={<HomePage />} />
        <Route path="/users" element={<UsersRoute />} />
        <Route path="/academies" element={<AcademiesRoute />} />
        <Route path="/memberships" element={<MembershipsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/myaccount/home" : "/login"} replace />} />
    </Routes>
  );
}

export function App(): ReactElement {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
