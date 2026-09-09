/** The password-reset request form: email in, a 6-digit code out (via email OTP). */

import type { FormEvent, ReactElement } from "react";

import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";

interface ForgotPasswordFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBackToSignIn: () => void;
}

export function ForgotPasswordForm({
  onSubmit,
  onBackToSignIn,
}: ForgotPasswordFormProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBackToSignIn}
        className="flex items-center gap-1.5 self-start text-sm text-white/75 hover:text-white"
      >
        &larr; Back to sign in
      </button>

      <div>
        <h2 className="mb-1.5 text-xl font-extrabold text-white">Reset your password</h2>
        <p className="text-sm leading-relaxed text-white/75">
          Enter the email on your account and we&apos;ll send a 6-digit code to reset your
          password.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          id="fg-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          theme="dark"
          required
        />
        <AuthButton type="submit" theme="dark">
          Send reset code
        </AuthButton>
      </form>
    </div>
  );
}
