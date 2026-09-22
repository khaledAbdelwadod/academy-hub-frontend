/** The registration form, matching the User schema: name, DOB, gender, phone, email, password. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { register } from "../../api/authApi";
import type { Gender } from "../../utils/gender";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";
import { SelectField } from "../ui/SelectField";

interface RegisterFormProps {
  onRegistered: (email: string) => void;
  onSwitchToSignIn: () => void;
}

type RegisterState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };

export function RegisterForm({ onRegistered, onSwitchToSignIn }: RegisterFormProps): ReactElement {
  const { t } = useTranslation(["auth", "common"]);
  const [state, setState] = useState<RegisterState>({ status: "idle" });
  const genderOptions = [
    { value: "male", label: t("common:gender.male") },
    { value: "female", label: t("common:gender.female") },
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const passwordConfirm = String(data.get("password_confirm") ?? "");

    if (password !== passwordConfirm) {
      setState({ status: "error", message: t("register.passwordMismatch") });
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
      gender: String(data.get("gender") ?? "") as Gender,
    })
      .then((result) => {
        setState({ status: "idle" });
        onRegistered(result.email);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t("errors.registrationFailed");
        logger.error("Registration failed", { error: message });
        setState({ status: "error", message });
      });
  }

  const isLoading = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-black">{t("register.heading")}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          id="rg-first"
          name="first_name"
          label={t("register.firstNameLabel")}
          placeholder={t("register.firstNamePlaceholder")}
          autoComplete="given-name"
          required
        />
        <FormField
          id="rg-middle"
          name="middle_name"
          label={t("register.middleNameLabel")}
          optional
          placeholder={t("register.middleNamePlaceholder")}
          autoComplete="additional-name"
        />
        <FormField
          id="rg-last"
          name="last_name"
          label={t("register.lastNameLabel")}
          placeholder={t("register.lastNamePlaceholder")}
          autoComplete="family-name"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          id="rg-email"
          name="email"
          label={t("register.emailLabel")}
          type="email"
          placeholder={t("register.emailPlaceholder")}
          autoComplete="email"
          required
        />
        <FormField
          id="rg-phone"
          name="phone"
          label={t("register.phoneLabel")}
          type="tel"
          placeholder={t("register.phonePlaceholder")}
          autoComplete="tel"
          required
        />
        <FormField
          id="rg-dob"
          name="date_of_birth"
          label={t("register.dobLabel")}
          type="date"
          autoComplete="bday"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectField
          id="rg-gender"
          name="gender"
          label={t("register.genderLabel")}
          options={genderOptions}
          defaultValue=""
          required
        />
        <PasswordField
          name="password"
          label={t("register.passwordLabel")}
          placeholder="••••••••••"
          autoComplete="new-password"
          required
        />
        <PasswordField
          name="password_confirm"
          label={t("register.passwordConfirmLabel")}
          placeholder="••••••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <p className="text-xs leading-relaxed text-black/50">{t("register.terms")}</p>

      {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

      <AuthButton type="submit" disabled={isLoading}>
        {isLoading ? t("register.submitting") : t("register.submit")}
      </AuthButton>

      <p className="text-center text-sm text-black/60">
        {t("register.alreadyHaveAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-bold text-black underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
        >
          {t("register.signIn")}
        </button>
      </p>
    </form>
  );
}
