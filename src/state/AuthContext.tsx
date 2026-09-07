/** Global auth/session state: which user (if any) is currently signed in. */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import type { AuthUser } from "../api/authApi";
import { fetchProfile } from "../api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  /** True once the initial session check (below) has finished, either way. */
  sessionChecked: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // The backend session lives in an HttpOnly cookie, so on a fresh page load
  // (or reload) there's no client-side memory of it - ask the backend whether
  // the cookie still maps to a valid session before deciding what to render.
  useEffect(() => {
    fetchProfile()
      .then((profile) => setUser(profile))
      .catch(() => setUser(null))
      .finally(() => setSessionChecked(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionChecked,
      signIn: (nextUser: AuthUser) => setUser(nextUser),
      signOut: () => setUser(null),
    }),
    [user, sessionChecked],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the current auth session.
 *
 * @returns The signed-in user (or null), whether the initial session check has
 *   finished, and functions to update the session.
 * @throws {Error} If called outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
