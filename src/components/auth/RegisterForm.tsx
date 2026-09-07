/** The registration form, matching the User schema: name, DOB, phone, email, password. */

import type { FormEvent, ReactElement } from "react";

import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface RegisterFormProps {
  onRegistered: (email: string) => void;
  onSwitchToSignIn: () => void;
}

export function RegisterForm({ onRegistered, onSwitchToSignIn }: RegisterFormProps): ReactElement {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    onRegistered(typeof email === "string" ? email : "");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-white">Create your account</h2>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="rg-first" label="First name" placeholder="Amira" autoComplete="given-name" required />
        <FormField id="rg-last" label="Last name" placeholder="Hassan" autoComplete="family-name" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="rg-middle"
          label="Middle name"
          optional
          placeholder="Youssef"
          autoComplete="additional-name"
        />
        <FormField id="rg-dob" label="Date of birth" type="date" autoComplete="bday" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="rg-phone"
          label="Phone number"
          type="tel"
          placeholder="+20 100 123 4567"
          autoComplete="tel"
          required
        />
        <FormField
          id="rg-email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PasswordField label="Password" placeholder="••••••••••" autoComplete="new-password" required />
        <PasswordField
          label="Confirm password"
          placeholder="••••••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <AuthButton type="submit">Create account</AuthButton>

      <p className="text-center text-xs leading-relaxed text-white/45">
        By continuing you agree to Academy Hub&apos;s Terms and Privacy Policy.
      </p>

      <p className="text-center text-sm text-white/60">
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
