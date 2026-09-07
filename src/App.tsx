import type { ReactElement } from "react";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./state/AuthContext";

function AppShell(): ReactElement {
  const { user } = useAuth();
  return user ? <HomePage user={user} /> : <LoginPage />;
}

export function App(): ReactElement {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
