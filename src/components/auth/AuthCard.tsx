/** The frosted-glass card holding the sign-in, register, and forgot-password panels. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { logger } from "../../utils/logger";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { RegisterForm } from "./RegisterForm";
import { SignInForm } from "./SignInForm";

type AuthMode = "signin" | "register" | "forgot";

function preventSubmit(mode: AuthMode) {
  return (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    logger.debug("Auth form submitted (not yet wired to an endpoint)", { mode });
  };
}

export function AuthCard(): ReactElement {
  const [mode, setMode] = useState<AuthMode>("signin");

  return (
    <div className="relative w-full rounded-[22px] border border-white/85 bg-gradient-to-br from-white/75 to-white/50 px-8 py-8 shadow-[0_24px_50px_-22px_rgba(38,70,83,0.28)] backdrop-blur-2xl backdrop-saturate-150">
      <div key={mode} className="animate-panel-in">
        {mode === "signin" && (
          <SignInForm
            onSubmit={preventSubmit("signin")}
            onForgotPassword={() => setMode("forgot")}
            onSwitchToRegister={() => setMode("register")}
          />
        )}
        {mode === "register" && (
          <RegisterForm onSubmit={preventSubmit("register")} onSwitchToSignIn={() => setMode("signin")} />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm
            onSubmit={preventSubmit("forgot")}
            onBackToSignIn={() => setMode("signin")}
          />
        )}
      </div>
    </div>
  );
}
