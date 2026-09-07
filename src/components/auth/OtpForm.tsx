/** The email-verification step shown right after registering: enter the 6-digit code. */

import type { FormEvent, ReactElement } from "react";

import { AuthButton } from "../ui/AuthButton";

interface OtpFormProps {
  email: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

export function OtpForm({ email, onSubmit, onBack }: OtpFormProps): ReactElement {
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

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

        <AuthButton type="submit">Verify account</AuthButton>

        <p className="text-center text-sm text-white/75">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            className="font-bold text-white underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
          >
            Resend
          </button>
        </p>
      </form>
    </div>
  );
}
