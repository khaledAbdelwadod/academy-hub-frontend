/** The signed-in app shell: nav bar over the video backdrop, switching between views. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../api/authApi";
import { logout } from "../api/authApi";
import { VideoBackdrop } from "../components/auth/VideoBackdrop";
import type { AppView } from "../components/nav/NavBar";
import { NavBar } from "../components/nav/NavBar";
import { useAuth } from "../state/AuthContext";
import { logger } from "../utils/logger";
import { ProfilePage } from "./ProfilePage";

interface HomePageProps {
  user: AuthUser;
}

export function HomePage({ user }: HomePageProps): ReactElement {
  const { signOut } = useAuth();
  const [view, setView] = useState<AppView>("home");

  function handleLogout(): void {
    logout()
      .catch((error: unknown) => {
        logger.error("Logout request failed", { error: error instanceof Error ? error.message : error });
      })
      .finally(() => signOut());
  }

  return (
    <div className="relative min-h-screen">
      <VideoBackdrop />
      <NavBar user={user} activeView={view} onNavigate={setView} onLogout={handleLogout} />

      {view === "home" ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-white/60">Home — coming soon.</p>
        </div>
      ) : (
        <ProfilePage />
      )}
    </div>
  );
}
