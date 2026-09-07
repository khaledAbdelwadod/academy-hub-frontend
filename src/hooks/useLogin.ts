/** Manages the sign-in request lifecycle: idle, loading, or error. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { useAuth } from "../state/AuthContext";
import { logger } from "../utils/logger";

type LoginState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };

/**
 * Track and drive a sign-in attempt; on success the global auth session updates
 * and the app navigates to /home.
 *
 * @returns The current login state and a function to submit an attempt.
 */
export function useLogin(): [LoginState, (email: string, password: string) => void] {
  const [state, setState] = useState<LoginState>({ status: "idle" });
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function submit(email: string, password: string): void {
    setState({ status: "loading" });
    login(email, password)
      .then((user) => {
        logger.info("Sign-in succeeded", { userId: user.id });
        signIn(user);
        navigate("/home", { replace: true });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        logger.error("Sign-in failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return [state, submit];
}
