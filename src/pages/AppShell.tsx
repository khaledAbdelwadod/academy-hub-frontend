/** Layout for signed-in pages: video backdrop + nav bar + the active page (via Outlet). */

import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout } from "../api/authApi";
import type { AppNotification } from "../api/notificationApi";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";
import { NavBar } from "../components/nav/NavBar";
import { AccountInfoModal } from "../components/profile/AccountInfoModal";
import { ChangePasswordModal } from "../components/profile/ChangePasswordModal";
import { ProfileModal } from "../components/profile/ProfileModal";
import { SubscriptionAlertBanner } from "../components/subscriptions/SubscriptionAlertBanner";
import { SubscriptionBlockedGate } from "../components/subscriptions/SubscriptionBlockedGate";
import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { useMySubscriptions } from "../hooks/useMySubscriptions";
import { useAuth } from "../state/AuthContext";
import { toDateKey } from "../utils/calendarDates";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";
import type { EventsRouteState } from "./EventsRoute";

type ModalName = "profile" | "account" | "password" | null;

export function AppShell(): ReactElement {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<ModalName>(null);
  const membership = useAcademyMembership();
  const subdomain = getAcademySubdomain();
  const isMember = membership.status === "ready" && membership.membership.is_member;
  // An unpaid platform fee (trial over, nothing paid for today) locks a player out of the academy.
  const isBlocked = isMember && membership.status === "ready" && membership.membership.subscription_blocked;
  const { state: subscriptions } = useMySubscriptions(user && isMember && !isBlocked ? subdomain : null);

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

  /** Opening a notification lands on that event's day in the calendar, with the event open. */
  function handleOpenNotification(notification: AppNotification): void {
    const target: EventsRouteState = { day: toDateKey(new Date(notification.event_start)) };
    if (notification.event !== null) target.eventId = notification.event;
    navigate("/events", { state: target });
  }

  const activeView = location.pathname.startsWith("/users")
    ? "users"
    : location.pathname.startsWith("/academies")
      ? "academies"
      : location.pathname.startsWith("/memberships")
        ? "memberships"
        : location.pathname.startsWith("/academy-profile")
          ? "academy-profile"
          : location.pathname.startsWith("/academy-members")
            ? "academy-members"
            : location.pathname.startsWith("/membership-requests")
              ? "membership-requests"
              : location.pathname.startsWith("/newsletters")
                ? "newsletters"
                : location.pathname.startsWith("/teams")
                  ? "teams"
                  : location.pathname.startsWith("/subscriptions")
                    ? "subscriptions"
                    : location.pathname.startsWith("/events")
                      ? "events"
                      : location.pathname.startsWith("/fees")
                        ? "fees"
                        : "home";

  const academyRoles = membership.status === "ready" ? membership.membership.roles : [];
  const alerts = subscriptions.status === "ready" ? subscriptions.data.subscriptions.filter((item) => item.is_alert) : [];
  const blockedGate =
    isBlocked && subdomain && membership.status === "ready" ? (
      <SubscriptionBlockedGate
        subdomain={subdomain}
        academyName={membership.membership.academy_name}
        academyLogo={membership.membership.academy_logo}
        reason={membership.membership.subscription_block_reason}
      />
    ) : null;

  // Every signed-in page keeps the login video behind it - the academy's own
  // video on its subdomain, the generic pool on www - with the white nav/cards
  // floating on top. Login/register/forgot already do the same thing.
  const academyVideo = membership.status === "ready" ? membership.membership.academy_login_background_video : null;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <VideoBackdrop sources={academyVideo ? [academyVideo] : undefined} />
      {showNavBar && (
        <NavBar
          user={user}
          activeView={activeView}
          // A blocked player only gets Home and the account menu: no tabs, no bell.
          academyRoles={isBlocked ? [] : academyRoles}
          academySubdomain={isBlocked ? null : subdomain}
          onNavigateHome={() => navigate("/myaccount/home")}
          onNavigateUsers={() => navigate("/users")}
          onNavigateAcademies={() => navigate("/academies")}
          onNavigateMemberships={() => navigate("/memberships")}
          onNavigateFees={() => navigate("/fees")}
          onNavigateAcademyProfile={() => navigate("/academy-profile")}
          onNavigateAcademyMembers={() => navigate("/academy-members")}
          onNavigateMembershipRequests={() => navigate("/membership-requests")}
          onNavigateNewsletters={() => navigate("/newsletters")}
          onNavigateTeams={() => navigate("/teams")}
          onNavigateSubscriptions={() => navigate("/subscriptions")}
          onNavigateEvents={() => navigate("/events")}
          onOpenNotification={handleOpenNotification}
          onOpenProfile={() => setModal("profile")}
          onOpenAccountInfo={() => setModal("account")}
          onOpenChangePassword={() => setModal("password")}
          onLogout={handleLogout}
        />
      )}
      {showNavBar && alerts.length > 0 && (
        <SubscriptionAlertBanner alerts={alerts} onView={() => navigate("/myaccount/home")} />
      )}

      {/* Pages (Home, Users) get the exact remaining viewport height here, so a
          page like Users can size its table to fill it and scroll internally
          instead of growing the whole document taller. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {blockedGate ?? <Outlet />}
      </div>

      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
      {modal === "account" && <AccountInfoModal onClose={() => setModal(null)} />}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
