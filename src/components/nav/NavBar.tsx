/** Top nav for the signed-in app: a Home tab on the left, user menu on the right. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../../api/authApi";

export type AppView = "home" | "profile";

interface NavBarProps {
  user: AuthUser;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export function NavBar({ user, activeView, onNavigate, onLogout }: NavBarProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-white/15 bg-black/45 px-6 py-3.5 backdrop-blur-2xl backdrop-saturate-150">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className={`text-sm font-bold transition-colors ${
          activeView === "home" ? "text-white" : "text-white/70 hover:text-white"
        }`}
      >
        Home
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-sm font-bold text-white">
            {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
          </span>
          <span className="text-sm font-semibold text-white">
            {user.first_name} {user.last_name}
          </span>
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-48 overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  onNavigate("profile");
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                My Profile
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="block w-full px-4 py-3 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
