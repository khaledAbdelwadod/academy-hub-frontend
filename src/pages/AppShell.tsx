/** Layout for signed-in pages: video backdrop + nav bar + the active page (via Outlet). */

import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout } from "../api/authApi";
import { NavBar } from "../components/nav/NavBar";
import { AccountInfoModal } from "../components/profile/AccountInfoModal";
import { ChangePasswordModal } from "../components/profile/ChangePasswordModal";
import { ProfileModal } from "../components/profile/ProfileModal";
import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { useAuth } from "../state/AuthContext";
import { logger } from "../utils/logger";

type ModalName = "profile" | "account" | "password" | null;

export function AppShell(): ReactElement {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<ModalName>(null);
  const membership = useAcademyMembership();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // On an academy subdomain, the nav (and its Users/Academies/Memberships/profile
  // tabs) only makes sense for someone who actually belongs there - hide it for
  // everyone else, including a superadmin (who isn't a member of any academy).
  const showNavBar =
    membership.status === "not-applicable" ||
    (membership.status === "ready" && membership.membership.is_member);

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
        : location.pathname.startsWith("/academy-profile")
          ? "academy-profile"
          : "home";

  const academyRoles = membership.status === "ready" ? membership.membership.roles : [];

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#00000059]">
      {showNavBar && (
        <NavBar
          user={user}
          activeView={activeView}
          academyRoles={academyRoles}
          onNavigateHome={() => navigate("/myaccount/home")}
          onNavigateUsers={() => navigate("/users")}
          onNavigateAcademies={() => navigate("/academies")}
          onNavigateMemberships={() => navigate("/memberships")}
          onNavigateAcademyProfile={() => navigate("/academy-profile")}
          onOpenProfile={() => setModal("profile")}
          onOpenAccountInfo={() => setModal("account")}
          onOpenChangePassword={() => setModal("password")}
          onLogout={handleLogout}
        />
      )}

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
