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

function tabClassName(active: boolean): string {
  return `rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
    active ? "bg-mint text-white" : "text-black hover:bg-mint hover:text-white"
  }`;
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
    <nav className="relative z-20 mx-4 mt-4 flex items-center justify-between rounded-2xl border border-mint bg-white/40 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150 sm:mx-6 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={onNavigateHome} className={tabClassName(activeView === "home")}>
          Home
        </button>
        {isAcademyManager && (
          <button
            type="button"
            onClick={onNavigateAcademyProfile}
            className={tabClassName(activeView === "academy-profile")}
          >
            Academy Profile
          </button>
        )}
        {user.is_superuser && (
          <button type="button" onClick={onNavigateUsers} className={tabClassName(activeView === "users")}>
            Users
          </button>
        )}
        {user.is_superuser && (
          <button type="button" onClick={onNavigateAcademies} className={tabClassName(activeView === "academies")}>
            Academies
          </button>
        )}
        {user.is_superuser && (
          <button
            type="button"
            onClick={onNavigateMemberships}
            className={tabClassName(activeView === "memberships")}
          >
            Memberships
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {academyRoles.length > 0 && (
          <span className="hidden rounded-full bg-mint/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-pine sm:inline-block">
            {academyRoles.map(capitalize).join(" · ")}
          </span>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-mint/15"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-sm font-bold text-white">
              {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
            </span>
            <span className="hidden text-sm font-semibold text-black sm:inline">
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
              <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-52 overflow-hidden rounded-xl border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)]">
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAccountInfo();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
                >
                  Account Info
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChangePassword();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="block w-full px-4 py-3 text-left text-sm text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
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
