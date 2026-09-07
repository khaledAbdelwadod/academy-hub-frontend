/** The login/register/forgot-password page served at www.academy-hub.net. */

import type { ReactElement } from "react";

import { AuthCard } from "../components/auth/AuthCard";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";

export function LoginPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <VideoBackdrop />

      <div className="animate-rise flex w-full max-w-[448px] flex-col items-center">
        <p className="mb-6 font-display text-4xl tracking-wider text-ink sm:text-5xl">
          ACADEMY<span className="text-coral">HUB</span>
        </p>

        <AuthCard />

        <footer className="mt-5 text-center text-xs text-ink/45">
          By continuing you agree to Academy Hub&apos;s Terms and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}
