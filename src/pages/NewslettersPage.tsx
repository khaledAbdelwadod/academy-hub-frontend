/** An academy manager/admin's "Newsletters" tab: post news, photos, and video for members. */

import type { ReactElement } from "react";

import { PostFeed } from "../components/newsletter/PostFeed";
import { useAuth } from "../state/AuthContext";
import { getAcademySubdomain } from "../utils/subdomain";

interface NewslettersPageProps {
  isManager: boolean;
}

export function NewslettersPage({ isManager }: NewslettersPageProps): ReactElement {
  const subdomain = getAcademySubdomain();
  const { user } = useAuth();

  if (!subdomain || !user) {
    return <div className="min-h-full" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PostFeed subdomain={subdomain} currentUserId={user.id} isManager={isManager} canPost />
    </div>
  );
}
