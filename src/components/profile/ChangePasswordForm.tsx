/** A form for the signed-in user to change their own password. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { changePassword } from "../../api/authApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { PasswordField } from "../ui/PasswordField";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "success" };

export function ChangePasswordForm(): ReactElement {
  const [state, setState] = useState<SaveState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current_password") ?? "");
    const next = String(data.get("new_password") ?? "");
    const confirm = String(data.get("confirm_password") ?? "");

    if (next !== confirm) {
      setState({ status: "error", message: "New passwords don't match." });
      return;
    }

    setState({ status: "saving" });
    changePassword(current, next)
      .then(() => {
        setState({ status: "success" });
        form.reset();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not change your password.";
        logger.error("Password change failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PasswordField
        name="current_password"
        label="Current password"
        autoComplete="current-password"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <PasswordField name="new_password" label="New password" autoComplete="new-password" required />
        <PasswordField
          name="confirm_password"
          label="Confirm new password"
          autoComplete="new-password"
          required
        />
      </div>

      {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-emerald-400">Password updated.</p>}

      <AuthButton type="submit" fullWidth={false} disabled={state.status === "saving"}>
        {state.status === "saving" ? "Updating…" : "Update password"}
      </AuthButton>
    </form>
  );
}
