/** Four soft, slowly-drifting color blobs behind the auth card. */

import type { ReactElement } from "react";

const BLOBS: { color: string; position: string; delay: string }[] = [
  { color: "bg-teal", position: "-top-[18vmax] -left-[14vmax]", delay: "0s" },
  { color: "bg-sun", position: "-top-[20vmax] -right-[16vmax]", delay: "-8s" },
  { color: "bg-sand", position: "-bottom-[20vmax] -left-[12vmax]", delay: "-16s" },
  { color: "bg-coral", position: "-bottom-[18vmax] -right-[14vmax]", delay: "-22s" },
];

export function GradientBackdrop(): ReactElement {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ground" aria-hidden="true">
      {BLOBS.map((blob) => (
        <div
          key={blob.color}
          className={`animate-drift absolute size-[56vmax] rounded-full opacity-65 blur-[60px] ${blob.color} ${blob.position}`}
          style={{ animationDelay: blob.delay }}
        />
      ))}
    </div>
  );
}
