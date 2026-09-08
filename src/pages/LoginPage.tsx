/**
 * The login/register/forgot-password page.
 *
 * Served both at the main www.academy-hub.net domain (generic Academy Hub
 * branding) and at each academy's own <subdomain>.academy-hub.net (that
 * academy's logo/background video). An unknown or inactive subdomain sends
 * the visitor to the main login page instead.
 */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { PublicAcademyBranding } from "../api/publicAcademyApi";
import { fetchAcademyBranding } from "../api/publicAcademyApi";
import { AuthCard } from "../components/auth/AuthCard";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";
import { getAcademySubdomain } from "../utils/subdomain";

type BrandingState =
  | { status: "generic" }
  | { status: "loading" }
  | { status: "branded"; academy: PublicAcademyBranding };

export function LoginPage(): ReactElement {
  const [branding, setBranding] = useState<BrandingState>(() =>
    getAcademySubdomain() ? { status: "loading" } : { status: "generic" },
  );

  useEffect(() => {
    const subdomain = getAcademySubdomain();
    if (!subdomain) {
      return;
    }
    fetchAcademyBranding(subdomain)
      .then((academy) => setBranding({ status: "branded", academy }))
      .catch(() => {
        window.location.href = "https://www.academy-hub.net/";
      });
  }, []);

  if (branding.status === "loading") {
    return <div className="min-h-screen" />;
  }

  const academy = branding.status === "branded" ? branding.academy : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <VideoBackdrop sources={academy?.login_background_video ? [academy.login_background_video] : undefined} />

      <div className="animate-rise flex w-full max-w-[760px] flex-col items-center">
        {academy ? (
          academy.logo ? (
            <img src={academy.logo} alt={academy.name} className="mb-7 max-h-24 max-w-[280px] object-contain" />
          ) : (
            <p className="mb-7 text-center font-display text-5xl tracking-wider text-white sm:text-6xl">
              {academy.name}
            </p>
          )
        ) : (
          <p className="mb-7 font-display text-6xl tracking-wider sm:text-7xl">
            <span
              className="text-white"
              style={{ WebkitTextStroke: "2px #2a9d8f", paintOrder: "stroke fill" }}
            >
              ACADEMY
            </span>
            <span className="text-coral">HUB</span>
          </p>
        )}

        <AuthCard />
      </div>
    </div>
  );
}
