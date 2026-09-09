/**
 * The signed-in "Home" landing content, rendered inside AppShell at /myaccount/home.
 *
 * Account home is a www-only concept (cross-academy aggregation + academy
 * picker, per the multi-tenancy decision) - on an academy subdomain this same
 * route instead shows that academy's status for the current user: a "coming
 * soon" placeholder for an active member (the real per-role dashboard isn't
 * built yet), or a "you're not a member here" card otherwise. The
 * manager-configurable join-request form described for that second case is
 * still a separate, not-yet-built feature - this only shows the fallback
 * "contact the academy" version.
 */

import { useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../api/authApi";
import type { MyAcademy } from "../api/membershipApi";
import { fetchMyAcademies } from "../api/membershipApi";
import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { useAuth } from "../state/AuthContext";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

/** A quiet way to sign out from a card that has no nav bar around it (see AppShell). */
function LogOutLink(): ReactElement {
  const { signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-6 text-xs font-bold uppercase tracking-wider text-white underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
    >
      Log out
    </button>
  );
}

interface AcademyHomeShellProps {
  logo: string | null;
  academyName: string;
  maxWidthClassName: string;
  children: ReactNode;
}

/** Shared chrome for the academy-subdomain home screens: logo above the card,
 * same layout as the login/register page. The academy's own login video goes
 * behind this (rendered by AppShell, which already knows the route/academy). */
function AcademyHomeShell({ logo, academyName, maxWidthClassName, children }: AcademyHomeShellProps): ReactElement {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-10">
      <div className={`animate-rise flex w-full flex-col items-center ${maxWidthClassName}`}>
        {logo && <img src={logo} alt={academyName} className="mb-7 max-h-24 max-w-[280px] object-contain" />}
        {children}
      </div>
      <LogOutLink />
    </div>
  );
}

interface WelcomeCardProps {
  academyName: string;
  academyLogo: string | null;
}

function WelcomeCard({ academyName, academyLogo }: WelcomeCardProps): ReactElement {
  return (
    <AcademyHomeShell logo={academyLogo} academyName={academyName} maxWidthClassName="max-w-[440px]">
      <div className="w-full rounded-[22px] border border-white/15 bg-black/20 px-8 py-9 text-center shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
        <p className="text-xs font-bold uppercase tracking-wider text-teal [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
          Welcome back
        </p>
        <h2 className="mt-1.5 text-2xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
          {academyName}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
          Your dashboard is on its way — check back soon.
        </p>
      </div>
    </AcademyHomeShell>
  );
}

interface NotAMemberCardProps {
  academyName: string;
  academyLogo: string | null;
  contactPhone: string;
}

function NotAMemberCard({ academyName, academyLogo, contactPhone }: NotAMemberCardProps): ReactElement {
  return (
    <AcademyHomeShell logo={academyLogo} academyName={academyName} maxWidthClassName="max-w-[500px]">
      <div className="w-full rounded-[22px] border border-white/15 bg-black/20 px-8 py-10 text-center shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150 sm:px-10">
        <h2 className="text-xl font-extrabold leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-sand to-coral bg-clip-text text-transparent">{academyName}</span>{" "}
          Academy
        </h2>
        <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-relaxed text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
          You&apos;re not a member yet.
        </p>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[15px] leading-relaxed text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
          For more details, please contact us.
        </p>

        {contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_26px_-10px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-10px_rgba(0,0,0,0.7)]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1.1-.2c1.1.5 2.4.7 3.7.7a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.7 21 3 13.3 3 4a1 1 0 0 1 1-1h3.3a1 1 0 0 1 1 1c0 1.3.2 2.6.7 3.7a1 1 0 0 1-.2 1.1L6.6 10.8Z" />
            </svg>
            {contactPhone}
          </a>
        )}
      </div>
    </AcademyHomeShell>
  );
}

function AcademyHome(): ReactElement {
  const state = useAcademyMembership();

  if (state.status === "not-applicable" || state.status === "loading") {
    return <div className="min-h-full" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <p className="text-white/60">Could not load this page.</p>
      </div>
    );
  }

  const { membership } = state;

  if (membership.is_member) {
    return <WelcomeCard academyName={membership.academy_name} academyLogo={membership.academy_logo} />;
  }

  return (
    <NotAMemberCard
      academyName={membership.academy_name}
      academyLogo={membership.academy_logo}
      contactPhone={membership.academy_contact_phone}
    />
  );
}

function AcademyPickerCard({ academy }: { academy: MyAcademy }): ReactElement {
  function handlePick(): void {
    window.location.href = `https://${academy.subdomain}.academy-hub.net/myaccount/home`;
  }

  return (
    <button
      type="button"
      onClick={handlePick}
      className="group relative aspect-video w-full overflow-hidden rounded-[22px] border border-white/15 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
    >
      {academy.login_background_video ? (
        <video
          src={academy.login_background_video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink to-teal" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

      <div className="relative flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
        {academy.logo && (
          <img
            src={academy.logo}
            alt=""
            className="max-h-14 max-w-[65%] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          />
        )}
        <p className="text-lg font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">{academy.name}</p>
      </div>
    </button>
  );
}

type WwwHomeState = { status: "loading" } | { status: "error" } | { status: "ready"; academies: MyAcademy[] };

function WwwAccountHome(): ReactElement {
  const [state, setState] = useState<WwwHomeState>({ status: "loading" });

  useEffect(() => {
    fetchMyAcademies()
      .then((academies) => setState({ status: "ready", academies }))
      .catch(() => setState({ status: "error" }));
  }, []);

  if (state.status === "loading") {
    return <div className="min-h-full" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <p className="text-white/60">Could not load your academies.</p>
      </div>
    );
  }

  if (state.academies.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <p className="text-white/60">You haven&apos;t joined an academy yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
      {state.academies.map((academy) => (
        <AcademyPickerCard key={academy.subdomain} academy={academy} />
      ))}
    </div>
  );
}

export function HomePage(): ReactElement {
  if (getAcademySubdomain()) {
    return <AcademyHome />;
  }

  return <WwwAccountHome />;
}
