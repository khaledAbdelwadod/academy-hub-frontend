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

  const activeView = location.pathname.startsWith("/users")
    ? "users"
    : location.pathname.startsWith("/academies")
      ? "academies"
      : location.pathname.startsWith("/memberships")
        ? "memberships"
        : "home";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <VideoBackdrop />
      <NavBar
        user={user}
        activeView={activeView}
        onNavigateHome={() => navigate("/myaccount/home")}
        onNavigateUsers={() => navigate("/users")}
        onNavigateAcademies={() => navigate("/academies")}
        onNavigateMemberships={() => navigate("/memberships")}
        onOpenProfile={() => setModal("profile")}
        onOpenAccountInfo={() => setModal("account")}
        onOpenChangePassword={() => setModal("password")}
        onLogout={handleLogout}
      />

      {/* Pages (Home, Users) get the exact remaining viewport height here, so a
          page like Users can size its table to fill it and scroll internally
          instead of growing the whole document taller. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
      {modal === "account" && <AccountInfoModal onClose={() => setModal(null)} />}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
