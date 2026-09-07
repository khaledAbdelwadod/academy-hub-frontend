/** A modal for the signed-in user to change their own password, separate from My Profile. */

import type { ReactElement } from "react";

import { ModalShell } from "../ui/ModalShell";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps): ReactElement {
  return (
    <ModalShell title="Change Password" onClose={onClose} maxWidthClassName="max-w-md">
      <ChangePasswordForm />
    </ModalShell>
  );
}
