/** The password-reset request form: email in, a 6-digit code out (via email OTP). */

import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("auth");

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBackToSignIn}
        className="flex items-center gap-1.5 self-start text-sm text-black/60 hover:text-black"
      >
        {t("forgotPassword.back")}
      </button>

      <div>
        <h2 className="mb-1.5 text-xl font-extrabold text-black">{t("forgotPassword.heading")}</h2>
        <p className="text-sm leading-relaxed text-black/60">{t("forgotPassword.description")}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          id="fg-email"
          label={t("forgotPassword.emailLabel")}
          type="email"
          placeholder={t("forgotPassword.emailPlaceholder")}
          autoComplete="email"
          required
        />
        <AuthButton type="submit">{t("forgotPassword.submit")}</AuthButton>
      </form>
    </div>
  );
}
