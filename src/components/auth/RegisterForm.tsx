/** The registration form, matching the User schema: name, DOB, phone, email, password. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { register } from "../../api/authApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface RegisterFormProps {
  onRegistered: (email: string) => void;
  onSwitchToSignIn: () => void;
}

type RegisterState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };

export function RegisterForm({ onRegistered, onSwitchToSignIn }: RegisterFormProps): ReactElement {
  const [state, setState] = useState<RegisterState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const passwordConfirm = String(data.get("password_confirm") ?? "");

    if (password !== passwordConfirm) {
      setState({ status: "error", message: "Passwords do not match." });
      return;
    }

    setState({ status: "loading" });
    register({
      email,
      password,
      password_confirm: passwordConfirm,
      first_name: String(data.get("first_name") ?? ""),
      middle_name: String(data.get("middle_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      date_of_birth: String(data.get("date_of_birth") ?? ""),
    })
      .then((result) => {
        setState({ status: "idle" });
        onRegistered(result.email);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not create your account.";
        logger.error("Registration failed", { error: message });
        setState({ status: "error", message });
      });
  }

  const isLoading = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-white">Create your account</h2>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          id="rg-first"
          name="first_name"
          label="First name"
          placeholder="Amira"
          autoComplete="given-name"
          theme="dark"
          required
        />
        <FormField
          id="rg-middle"
          name="middle_name"
          label="Middle name"
          optional
          placeholder="Youssef"
          autoComplete="additional-name"
          theme="dark"
        />
        <FormField
          id="rg-last"
          name="last_name"
          label="Last name"
          placeholder="Hassan"
          autoComplete="family-name"
          theme="dark"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          id="rg-email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          theme="dark"
          required
        />
        <FormField
          id="rg-phone"
          name="phone"
          label="Phone number"
          type="tel"
          placeholder="+20 100 123 4567"
          autoComplete="tel"
          theme="dark"
          required
        />
        <FormField
          id="rg-dob"
          name="date_of_birth"
          label="Date of birth"
          type="date"
          autoComplete="bday"
          theme="dark"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <PasswordField
          name="password"
          label="Password"
          placeholder="••••••••••"
          autoComplete="new-password"
          theme="dark"
          required
        />
        <PasswordField
          name="password_confirm"
          label="Confirm password"
          placeholder="••••••••••"
          autoComplete="new-password"
          theme="dark"
          required
        />
        <p className="self-end text-xs leading-relaxed text-white/65">
          By continuing you agree to Academy Hub&apos;s Terms and Privacy Policy.
        </p>
      </div>

      {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

      <AuthButton type="submit" theme="dark" disabled={isLoading}>
        {isLoading ? "Creating account…" : "Create account"}
      </AuthButton>

      <p className="text-center text-sm text-white/75">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-bold text-white underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
