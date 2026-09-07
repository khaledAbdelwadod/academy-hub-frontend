/** Layout for signed-in pages: video backdrop + nav bar + the active page (via Outlet). */

import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout } from "../api/authApi";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";
import { NavBar } from "../components/nav/NavBar";
import { AccountInfoModal } from "../components/profile/AccountInfoModal";
import { ChangePasswordModal } from "../components/profile/ChangePasswordModal";
import { ProfileModal } from "../components/profile/ProfileModal";
import { useAuth } from "../state/AuthContext";
import { logger } from "../utils/logger";

type ModalName = "profile" | "account" | "password" | null;

export function AppShell(): ReactElement {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<ModalName>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout(): void {
    logout()
      .catch((error: unknown) => {
        logger.error("Logout request failed", { error: error instanceof Error ? error.message : error });
      })
      .finally(() => {
        signOut();
        navigate("/login", { replace: true });
      });
  }

  const activeView = location.pathname.startsWith("/users") ? "users" : "home";

  return (
    <div className="relative min-h-screen">
      <VideoBackdrop />
      <NavBar
        user={user}
        activeView={activeView}
        onNavigateHome={() => navigate("/home")}
        onNavigateUsers={() => navigate("/users")}
        onOpenProfile={() => setModal("profile")}
        onOpenAccountInfo={() => setModal("account")}
        onOpenChangePassword={() => setModal("password")}
        onLogout={handleLogout}
      />

      <Outlet />

      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
      {modal === "account" && <AccountInfoModal onClose={() => setModal(null)} />}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
