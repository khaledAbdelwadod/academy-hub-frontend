/** The email-verification step shown right after registering: enter the 6-digit code. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { resendRegistrationCode, verifyRegistration } from "../../api/authApi";
import { useAuth } from "../../state/AuthContext";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";

interface OtpFormProps {
  email: string;
  onBack: () => void;
}

type VerifyState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };
type ResendState = { status: "idle" } | { status: "sending" } | { status: "sent" } | { status: "error"; message: string };

export function OtpForm({ email, onBack }: OtpFormProps): ReactElement {
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle" });
  const [resendState, setResendState] = useState<ResendState>({ status: "idle" });
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");

    setVerifyState({ status: "loading" });
    verifyRegistration(email, code)
      .then((user) => {
        logger.info("Registration verified", { userId: user.id });
        signIn(user);
        navigate("/myaccount/home", { replace: true });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Invalid or expired code.";
        logger.error("Registration verification failed", { error: message });
        setVerifyState({ status: "error", message });
      });
  }

  function handleResend(): void {
    setResendState({ status: "sending" });
    resendRegistrationCode(email)
      .then(() => setResendState({ status: "sent" }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not resend the code.";
        setResendState({ status: "error", message });
      });
  }

  const isVerifying = verifyState.status === "loading";
  const isResending = resendState.status === "sending";

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-white/75 hover:text-white"
      >
        &larr; Back
      </button>

      <div>
        <h2 className="mb-1.5 text-xl font-extrabold text-white">Verify your email</h2>
        <p className="text-sm leading-relaxed text-white/75">
          Enter the 6-digit code we sent to <span className="font-semibold text-white">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp-code" className="text-xs font-bold uppercase tracking-wider text-white/90">
            Verification code
          </label>
          <input
            id="otp-code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            required
            className="w-full rounded-xl border border-white/30 bg-white/20 px-3.5 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-white/40 transition-colors focus:border-coral focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
          />
        </div>

        {verifyState.status === "error" && <p className="text-sm text-red-400">{verifyState.message}</p>}

        <AuthButton type="submit" theme="dark" disabled={isVerifying}>
          {isVerifying ? "Verifying…" : "Verify account"}
        </AuthButton>

        <p className="text-center text-sm text-white/75">
          {resendState.status === "sent" ? (
            "A new code is on its way."
          ) : (
            <>
              Didn&apos;t get a code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-bold text-white underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current disabled:opacity-60"
              >
                {isResending ? "Sending…" : "Resend"}
              </button>
            </>
          )}
        </p>
        {resendState.status === "error" && <p className="text-sm text-red-400">{resendState.message}</p>}
      </form>
    </div>
  );
}
