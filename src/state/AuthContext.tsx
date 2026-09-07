/** Global auth/session state: which user (if any) is currently signed in. */

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import type { AuthUser } from "../api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: (nextUser: AuthUser) => setUser(nextUser),
      signOut: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the current auth session.
 *
 * @returns The signed-in user (or null) and functions to update the session.
 * @throws {Error} If called outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
