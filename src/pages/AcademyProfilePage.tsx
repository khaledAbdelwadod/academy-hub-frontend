/** An academy manager's "Profile" tab: sub-tabs for Info, Media, Locations, and the Join Request Form. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { ManagerAcademyProfile } from "../api/managerAcademyApi";
import { fetchMyAcademyProfile } from "../api/managerAcademyApi";
import { AcademyInfoTab } from "../components/academy-profile/AcademyInfoTab";
import { AcademyLocationsTab } from "../components/academy-profile/AcademyLocationsTab";
import { AcademyMediaTab } from "../components/academy-profile/AcademyMediaTab";
import { JoinRequestFormTab } from "../components/academy-profile/JoinRequestFormTab";
import { TabStrip } from "../components/ui/TabStrip";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: ManagerAcademyProfile };

type ProfileTab = "info" | "media" | "locations" | "join-form";

const PROFILE_TABS: ReadonlyArray<{ id: ProfileTab; label: string }> = [
  { id: "info", label: "Info" },
  { id: "media", label: "Media" },
  { id: "locations", label: "Locations" },
  { id: "join-form", label: "Join Request Form" },
];

export function AcademyProfilePage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");

  useEffect(() => {
    if (!subdomain) {
      return;
    }
    fetchMyAcademyProfile(subdomain)
      .then((profile) => setState({ status: "ready", profile }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load the academy profile.";
        logger.error("Failed to load academy profile", { error: message });
        setState({ status: "error", message });
      });
  }, [subdomain]);

  if (!subdomain || state.status === "loading") {
    return <div className="min-h-full" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <p className="text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{state.message}</p>
      </div>
    );
  }

  const { profile } = state;
  const updateProfile = (updated: ManagerAcademyProfile): void => setState({ status: "ready", profile: updated });

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-8">
      <div className="overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <div className="border-b border-mint px-4 py-3">
          <TabStrip tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} label="Academy profile sections" />
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "info" && <AcademyInfoTab subdomain={subdomain} profile={profile} onSaved={updateProfile} />}
          {activeTab === "media" && (
            <AcademyMediaTab subdomain={subdomain} profile={profile} onProfileChange={updateProfile} />
          )}
          {activeTab === "locations" && <AcademyLocationsTab subdomain={subdomain} profile={profile} />}
          {activeTab === "join-form" && <JoinRequestFormTab subdomain={subdomain} />}
        </div>
      </div>
    </div>
  );
}
