/** The frosted-glass card holding the sign-in, register, forgot-password, and OTP panels. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { logger } from "../../utils/logger";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { OtpForm } from "./OtpForm";
import { RegisterForm } from "./RegisterForm";
import { SignInForm } from "./SignInForm";

type AuthMode = "signin" | "register" | "forgot" | "otp";

function preventSubmit(mode: AuthMode) {
  return (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    logger.debug("Auth form submitted (not yet wired to an endpoint)", { mode });
  };
}

export function AuthCard(): ReactElement {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pendingEmail, setPendingEmail] = useState("");

  function handleRegistered(email: string): void {
    logger.debug("Registration submitted (not yet wired to an endpoint)", { email });
    setPendingEmail(email);
    setMode("otp");
  }

  const cardWidthClass = mode === "register" ? "max-w-[560px]" : "max-w-[448px]";

  return (
    <div
      className={`relative w-full rounded-[22px] border border-white/15 bg-black/80 px-8 py-8 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150 transition-[max-width] duration-300 ${cardWidthClass}`}
    >
      <div key={mode} className="animate-panel-in">
        {mode === "signin" && (
          <SignInForm
            onSubmit={preventSubmit("signin")}
            onForgotPassword={() => setMode("forgot")}
            onSwitchToRegister={() => setMode("register")}
          />
        )}
        {mode === "register" && (
          <RegisterForm onRegistered={handleRegistered} onSwitchToSignIn={() => setMode("signin")} />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm
            onSubmit={preventSubmit("forgot")}
            onBackToSignIn={() => setMode("signin")}
          />
        )}
        {mode === "otp" && (
          <OtpForm
            email={pendingEmail}
            onSubmit={preventSubmit("otp")}
            onBack={() => setMode("register")}
          />
        )}
      </div>
    </div>
  );
}
