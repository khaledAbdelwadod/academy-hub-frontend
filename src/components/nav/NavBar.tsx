/** Top nav for the signed-in app: page tabs on the left, notifications + user menu on the right. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../../api/authApi";
import type { AppNotification } from "../../api/notificationApi";
import { NotificationBell } from "./NotificationBell";

interface NavBarProps {
  user: AuthUser;
  activeView:
    | "home"
    | "users"
    | "academies"
    | "memberships"
    | "academy-profile"
    | "academy-members"
    | "membership-requests"
    | "newsletters"
    | "teams"
    | "events";
  /** Every active role the user holds at the current academy subdomain; empty/omitted on www. */
  academyRoles?: string[];
  /** The academy subdomain the app is on, if any - the bell shows that academy's notifications. */
  academySubdomain?: string | null;
  onNavigateHome: () => void;
  onNavigateUsers: () => void;
  onNavigateAcademies: () => void;
  onNavigateMemberships: () => void;
  onNavigateAcademyProfile: () => void;
  onNavigateAcademyMembers: () => void;
  onNavigateMembershipRequests: () => void;
  onNavigateNewsletters: () => void;
  onNavigateTeams: () => void;
  onNavigateEvents: () => void;
  onOpenNotification: (notification: AppNotification) => void;
  onOpenProfile: () => void;
  onOpenAccountInfo: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tabClassName(active: boolean): string {
  return `shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-bold transition-colors ${
    active ? "bg-mint text-white" : "text-black hover:bg-mint hover:text-white"
  }`;
}

export function NavBar({
  user,
  activeView,
  academyRoles = [],
  academySubdomain = null,
  onNavigateHome,
  onNavigateUsers,
  onNavigateAcademies,
  onNavigateMemberships,
  onNavigateAcademyProfile,
  onNavigateAcademyMembers,
  onNavigateMembershipRequests,
  onNavigateNewsletters,
  onNavigateTeams,
  onNavigateEvents,
  onOpenNotification,
  onOpenProfile,
  onOpenAccountInfo,
  onOpenChangePassword,
  onLogout,
}: NavBarProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const isAcademyMember = academyRoles.length > 0;
  const isAcademyManager = academyRoles.includes("manager");
  const isAcademyManagerOrAdmin = isAcademyManager || academyRoles.includes("admin");

  return (
    <div className="relative z-20 mx-auto mt-4 w-full max-w-[900px] px-4 sm:px-8">
      <nav className="relative flex items-center justify-between gap-3 rounded-2xl border border-mint bg-white/40 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
        <div className="-my-1 flex min-w-0 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={onNavigateHome} className={tabClassName(activeView === "home")}>
            Home
          </button>
          {isAcademyManager && (
            <button
              type="button"
              onClick={onNavigateAcademyProfile}
              className={tabClassName(activeView === "academy-profile")}
            >
              Profile
            </button>
          )}
          {isAcademyManager && (
            <button
              type="button"
              onClick={onNavigateAcademyMembers}
              className={tabClassName(activeView === "academy-members")}
            >
              Members
            </button>
          )}
          {isAcademyManager && (
            <button
              type="button"
              onClick={onNavigateMembershipRequests}
              className={tabClassName(activeView === "membership-requests")}
            >
              Membership Requests
            </button>
          )}
          {isAcademyManagerOrAdmin && (
            <button
              type="button"
              onClick={onNavigateNewsletters}
              className={tabClassName(activeView === "newsletters")}
            >
              Newsletters
            </button>
          )}
          {isAcademyManagerOrAdmin && (
            <button type="button" onClick={onNavigateTeams} className={tabClassName(activeView === "teams")}>
              Teams
            </button>
          )}
          {isAcademyMember && (
            <button type="button" onClick={onNavigateEvents} className={tabClassName(activeView === "events")}>
              Events
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

        <div className="flex shrink-0 items-center gap-2">
          {isAcademyMember && academySubdomain && (
            <NotificationBell subdomain={academySubdomain} onOpenNotification={onOpenNotification} />
          )}

          <div className="relative">
            <button
              type="button"
              aria-label="Account menu"
              title={`${user.first_name} ${user.last_name}`}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center rounded-full p-0.5 transition-colors hover:bg-mint/15"
            >
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-sm font-bold text-white">
                {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
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
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-60 overflow-hidden rounded-xl border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)]">
                  <div className="flex flex-col items-start gap-1.5 border-b border-mint px-4 py-3">
                    <span className="text-sm font-bold text-black">
                      {user.first_name} {user.last_name}
                    </span>
                    {isAcademyMember && (
                      <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-pine">
                        {academyRoles.map(capitalize).join(" · ")}
                      </span>
                    )}
                  </div>
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
    </div>
  );
}
