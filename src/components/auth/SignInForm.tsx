/** The sign-in form: email + password. */

import type { FormEvent, ReactElement } from "react";

import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface SignInFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export function SignInForm({
  onSubmit,
  onForgotPassword,
  onSwitchToRegister,
}: SignInFormProps): ReactElement {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-white">Sign in</h2>

      <FormField
        id="si-email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <PasswordField
        label="Password"
        placeholder="••••••••••"
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-white/75">
          <input type="checkbox" className="size-3.5 accent-coral" />
          Keep me signed in
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-white/75 underline decoration-transparent underline-offset-2 transition-colors hover:text-white hover:decoration-current"
        >
          Forgot password?
        </button>
      </div>

      <AuthButton type="submit" fullWidth={false}>
        Sign in
      </AuthButton>

      <p className="mt-1 text-center text-sm text-white/75">
        New to Academy Hub?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-white underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}
