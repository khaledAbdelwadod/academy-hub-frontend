/** The Academy Profile "Media" tab: upload or replace the logo, legal document, and login-page video. */

import type { ReactElement } from "react";

import type { ManagerAcademyProfile } from "../../api/managerAcademyApi";
import {
  uploadMyAcademyLegalDocument,
  uploadMyAcademyLoginVideo,
  uploadMyAcademyLogo,
} from "../../api/managerAcademyApi";
import { AcademyFileField } from "../ui/AcademyFileField";

interface AcademyMediaTabProps {
  subdomain: string;
  profile: ManagerAcademyProfile;
  /** Called with the academy's new details after any upload succeeds. */
  onProfileChange: (profile: ManagerAcademyProfile) => void;
}

export function AcademyMediaTab({ subdomain, profile, onProfileChange }: AcademyMediaTabProps): ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <AcademyFileField
        label="Logo"
        currentUrl={profile.logo}
        accept="image/*"
        onUpload={(file) => uploadMyAcademyLogo(subdomain, file).then(onProfileChange)}
      />
      <AcademyFileField
        label="Legal document"
        currentUrl={profile.legal_document}
        accept="application/pdf,image/*"
        onUpload={(file) => uploadMyAcademyLegalDocument(subdomain, file).then(onProfileChange)}
      />
      <AcademyFileField
        label="Login page background video"
        currentUrl={profile.login_background_video}
        accept="video/mp4,video/webm,video/quicktime"
        onUpload={(file) => uploadMyAcademyLoginVideo(subdomain, file).then(onProfileChange)}
      />
    </div>
  );
}
