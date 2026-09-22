/** The sign-in form: email + password. */

import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useLogin } from "../../hooks/useLogin";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { PasswordField } from "../ui/PasswordField";

interface SignInFormProps {
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export function SignInForm({ onForgotPassword, onSwitchToRegister }: SignInFormProps): ReactElement {
  const { t } = useTranslation("auth");
  const [state, submit] = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
  }

  const isLoading = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="mb-0.5 text-xl font-extrabold text-black">{t("signIn.heading")}</h2>

      <FormField
        id="si-email"
        name="email"
        label={t("signIn.emailLabel")}
        type="email"
        placeholder={t("signIn.emailPlaceholder")}
        autoComplete="email"
        required
      />
      <PasswordField
        name="password"
        label={t("signIn.passwordLabel")}
        placeholder="••••••••••"
        autoComplete="current-password"
        required
      />

      {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-black/60">
          <input type="checkbox" className="size-3.5 accent-mint" />
          {t("signIn.keepSignedIn")}
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-black/60 underline decoration-transparent underline-offset-2 transition-colors hover:text-black hover:decoration-current"
        >
          {t("signIn.forgotPassword")}
        </button>
      </div>

      <AuthButton type="submit" fullWidth={false} disabled={isLoading}>
        {isLoading ? t("signIn.submitting") : t("signIn.submit")}
      </AuthButton>

      <p className="mt-1 text-center text-sm text-black/60">
        {t("signIn.newToAcademyHub")}{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-black underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
        >
          {t("signIn.createAccount")}
        </button>
      </p>
    </form>
  );
}
