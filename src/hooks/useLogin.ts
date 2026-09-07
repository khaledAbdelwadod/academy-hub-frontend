/** Manages the sign-in request lifecycle: idle, loading, error, or signed in. */

import { useState } from "react";

import type { AuthUser } from "../api/authApi";
import { login } from "../api/authApi";
import { logger } from "../utils/logger";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; user: AuthUser };

/**
 * Track and drive a sign-in attempt.
 *
 * @returns The current login state and a function to submit an attempt.
 */
export function useLogin(): [LoginState, (email: string, password: string) => void] {
  const [state, setState] = useState<LoginState>({ status: "idle" });

  function submit(email: string, password: string): void {
    setState({ status: "loading" });
    login(email, password)
      .then((user) => {
        logger.info("Sign-in succeeded", { userId: user.id });
        setState({ status: "success", user });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        logger.error("Sign-in failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return [state, submit];
}
