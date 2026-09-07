/** A modal for the superadmin to create a new user or edit an existing one. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import type { AdminUser } from "../../api/adminUsersApi";
import { createUser, updateUser } from "../../api/adminUsersApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { PasswordField } from "../ui/PasswordField";

interface UserFormModalProps {
  /** The user being edited, or null to create a new one. */
  user: AdminUser | null;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function UserFormModal({ user, onClose, onSaved }: UserFormModalProps): ReactElement {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const isCreate = user === null;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      first_name: String(data.get("first_name") ?? ""),
      middle_name: String(data.get("middle_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      date_of_birth: String(data.get("date_of_birth") ?? ""),
      is_active: data.get("is_active") === "on",
      is_staff: data.get("is_staff") === "on",
      is_superuser: data.get("is_superuser") === "on",
    };

    setState({ status: "saving" });
    const request = isCreate
      ? createUser({ ...fields, password: String(data.get("password") ?? "") })
      : updateUser(user.id, fields);

    request
      .then((saved) => {
        setState({ status: "idle" });
        onSaved(saved);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save that user.";
        logger.error("Admin user save failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return (
    <ModalShell title={isCreate ? "Create User" : "Edit User"} onClose={onClose} maxWidthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField id="uf-first" name="first_name" label="First name" defaultValue={user?.first_name} required />
          <FormField
            id="uf-middle"
            name="middle_name"
            label="Middle name"
            optional
            defaultValue={user?.middle_name}
          />
          <FormField id="uf-last" name="last_name" label="Last name" defaultValue={user?.last_name} required />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField
            id="uf-email"
            name="email"
            label="Email address"
            type="email"
            defaultValue={user?.email}
            required
          />
          <FormField id="uf-phone" name="phone" label="Phone number" defaultValue={user?.phone} required />
          <FormField
            id="uf-dob"
            name="date_of_birth"
            label="Date of birth"
            type="date"
            defaultValue={user?.date_of_birth}
            required
          />
        </div>

        {isCreate && (
          <PasswordField name="password" label="Initial password" autoComplete="new-password" required />
        )}

        <div className="flex flex-wrap gap-5 pt-1 text-sm text-white/80">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={user?.is_active ?? true}
              className="size-3.5 accent-coral"
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_staff"
              defaultChecked={user?.is_staff ?? false}
              className="size-3.5 accent-coral"
            />
            Staff access
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_superuser"
              defaultChecked={user?.is_superuser ?? false}
              className="size-3.5 accent-coral"
            />
            Super admin
          </label>
        </div>

        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={state.status === "saving"}>
          {state.status === "saving" ? "Saving…" : isCreate ? "Create user" : "Save changes"}
        </AuthButton>
      </form>
    </ModalShell>
  );
}
