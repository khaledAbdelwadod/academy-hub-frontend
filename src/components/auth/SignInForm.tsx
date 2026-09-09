/** The sign-in form: email + password. */

import type { FormEvent, ReactElement } from "react";

import { useLogin } from "../../hooks/useLogin";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface SignInFormProps {
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export function SignInForm({ onForgotPassword, onSwitchToRegister }: SignInFormProps): ReactElement {
  const [state, submit] = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
  }

  const isLoading = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-white">Sign in</h2>

      <FormField
        id="si-email"
        name="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        theme="dark"
        required
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="••••••••••"
        autoComplete="current-password"
        theme="dark"
        required
      />

      {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

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

      <AuthButton type="submit" fullWidth={false} theme="dark" disabled={isLoading}>
        {isLoading ? "Signing in…" : "Sign in"}
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
