/** A modal for the signed-in user to change their own password, separate from My Profile. */

import type { ReactElement } from "react";

import { ChangePasswordForm } from "./ChangePasswordForm";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps): ReactElement {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-10">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />

      <div className="relative w-full max-w-md rounded-[22px] border border-white/15 bg-black/70 p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>

        <h1 className="mb-6 text-2xl font-extrabold text-white">Change Password</h1>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
