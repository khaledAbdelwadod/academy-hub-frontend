/** Top nav for the signed-in app: page tabs on the left, user menu on the right. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../../api/authApi";

interface NavBarProps {
  user: AuthUser;
  activeView: "home" | "users" | "academies" | "memberships" | "academy-profile";
  /** Every active role the user holds at the current academy subdomain; empty/omitted on www. */
  academyRoles?: string[];
  onNavigateHome: () => void;
  onNavigateUsers: () => void;
  onNavigateAcademies: () => void;
  onNavigateMemberships: () => void;
  onNavigateAcademyProfile: () => void;
  onOpenProfile: () => void;
  onOpenAccountInfo: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function NavBar({
  user,
  activeView,
  academyRoles = [],
  onNavigateHome,
  onNavigateUsers,
  onNavigateAcademies,
  onNavigateMemberships,
  onNavigateAcademyProfile,
  onOpenProfile,
  onOpenAccountInfo,
  onOpenChangePassword,
  onLogout,
}: NavBarProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const isAcademyManager = academyRoles.includes("manager");

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-white/15 bg-black/45 px-4 py-3.5 backdrop-blur-2xl backdrop-saturate-150 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className={`text-sm font-bold transition-colors ${
            activeView === "home" ? "text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Home
        </button>
        {isAcademyManager && (
          <button
            type="button"
            onClick={onNavigateAcademyProfile}
            className={`text-sm font-bold transition-colors ${
              activeView === "academy-profile" ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Academy Profile
          </button>
        )}
        {user.is_superuser && (
          <button
            type="button"
            onClick={onNavigateUsers}
            className={`text-sm font-bold transition-colors ${
              activeView === "users" ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Users
          </button>
        )}
        {user.is_superuser && (
          <button
            type="button"
            onClick={onNavigateAcademies}
            className={`text-sm font-bold transition-colors ${
              activeView === "academies" ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Academies
          </button>
        )}
        {user.is_superuser && (
          <button
            type="button"
            onClick={onNavigateMemberships}
            className={`text-sm font-bold transition-colors ${
              activeView === "memberships" ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Memberships
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {academyRoles.length > 0 && (
          <span className="hidden rounded-full bg-teal/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal sm:inline-block">
            {academyRoles.map(capitalize).join(" · ")}
          </span>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-sm font-bold text-white">
              {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
            </span>
            <span className="hidden text-sm font-semibold text-white sm:inline">
              {user.first_name} {user.last_name}
            </span>
          </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-52 overflow-hidden rounded-xl border border-white/15 bg-black/45 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
              <button
                type="button"
                onClick={() => {
                  onOpenProfile();
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                My Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAccountInfo();
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                Account Info
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChangePassword();
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </nav>
  );
}
