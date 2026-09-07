/** The registration form, matching the User schema: name, DOB, phone, email, password. */

import type { FormEvent, ReactElement } from "react";

import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface RegisterFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSwitchToSignIn: () => void;
}

export function RegisterForm({ onSubmit, onSwitchToSignIn }: RegisterFormProps): ReactElement {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-ink">Create your account</h2>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="rg-first" label="First name" placeholder="Amira" autoComplete="given-name" required />
        <FormField id="rg-last" label="Last name" placeholder="Hassan" autoComplete="family-name" required />
      </div>

      <FormField
        id="rg-middle"
        label="Middle name"
        optional
        placeholder="Youssef"
        autoComplete="additional-name"
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField id="rg-dob" label="Date of birth" type="date" autoComplete="bday" required />
        <FormField
          id="rg-phone"
          label="Phone number"
          type="tel"
          placeholder="+20 100 123 4567"
          autoComplete="tel"
          required
        />
      </div>

      <FormField
        id="rg-email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

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

      <p className="text-xs leading-relaxed text-ink/45">
        We&apos;ll email a 6-digit code to verify your address before your account is active.
      </p>

      <p className="mt-1 text-center text-sm text-ink/65">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-bold text-ink underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
