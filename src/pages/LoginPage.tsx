/** The login/register/forgot-password page served at www.academy-hub.net. */

import type { ReactElement } from "react";

import { AuthCard } from "../components/auth/AuthCard";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";

export function LoginPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <VideoBackdrop />

      <div className="animate-rise flex w-full max-w-[760px] flex-col items-center">
        <p className="mb-7 font-display text-6xl tracking-wider sm:text-7xl">
          <span
            className="text-white"
            style={{ WebkitTextStroke: "2px #2a9d8f", paintOrder: "stroke fill" }}
          >
            ACADEMY
          </span>
          <span className="text-coral">HUB</span>
        </p>

        <AuthCard />
      </div>
    </div>
  );
}
