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

import type { MyMembership } from "../api/membershipApi";
import { fetchMyMembership } from "../api/membershipApi";
import { getAcademySubdomain } from "../utils/subdomain";

type AcademyHomeState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; membership: MyMembership };

function CenteredCard({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
      <div className="animate-rise w-full max-w-[440px] rounded-[22px] border border-white/15 bg-black/45 px-8 py-9 text-center shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
        {children}
      </div>
    </div>
  );
}

function WelcomeCard({ academyName }: { academyName: string }): ReactElement {
  return (
    <CenteredCard>
      <p className="text-xs font-bold uppercase tracking-wider text-teal">Welcome back</p>
      <h2 className="mt-1.5 text-2xl font-extrabold text-white">{academyName}</h2>
      <p className="mt-2.5 text-sm leading-relaxed text-white/60">
        Your dashboard is on its way — check back soon.
      </p>
    </CenteredCard>
  );
}

function NotAMemberCard({ academyName, contactPhone }: { academyName: string; contactPhone: string }): ReactElement {
  return (
    <CenteredCard>
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-sand to-coral text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-6">
          <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h2 className="text-2xl font-extrabold text-white">Not a member yet</h2>
      <p className="mt-2.5 text-sm leading-relaxed text-white/70">
        You don&apos;t have access to <span className="font-semibold text-white">{academyName}</span> yet. Reach
        out to the academy admin to get set up.
      </p>

      {contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/30 hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1.1-.2c1.1.5 2.4.7 3.7.7a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.7 21 3 13.3 3 4a1 1 0 0 1 1-1h3.3a1 1 0 0 1 1 1c0 1.3.2 2.6.7 3.7a1 1 0 0 1-.2 1.1L6.6 10.8Z" />
          </svg>
          {contactPhone}
        </a>
      )}
    </CenteredCard>
  );
}

function AcademyHome(): ReactElement {
  const [state, setState] = useState<AcademyHomeState>({ status: "loading" });

  useEffect(() => {
    const subdomain = getAcademySubdomain();
    if (!subdomain) {
      return;
    }
    fetchMyMembership(subdomain)
      .then((membership) => setState({ status: "ready", membership }))
      .catch(() => setState({ status: "error" }));
  }, []);

  if (state.status === "loading") {
    return <div className="min-h-[60vh]" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-white/60">Could not load this page.</p>
      </div>
    );
  }

  const { membership } = state;

  if (membership.is_member) {
    return <WelcomeCard academyName={membership.academy_name} />;
  }

  return <NotAMemberCard academyName={membership.academy_name} contactPhone={membership.academy_contact_phone} />;
}

export function HomePage(): ReactElement {
  if (getAcademySubdomain()) {
    return <AcademyHome />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-white/60">Home — coming soon.</p>
    </div>
  );
}
