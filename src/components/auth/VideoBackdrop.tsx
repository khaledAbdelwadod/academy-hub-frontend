/** Full-bleed looping video pool behind the auth card, tinted to keep the palette's happy feel. */

import type { ReactElement } from "react";

import { useVideoPool } from "../../hooks/useVideoPool";

// Auto-discovered at build time: drop/remove files in src/assets/loginbackgroundvideos
// and the pool picks them up on the next build, no code change needed.
const videoModules = import.meta.glob("../../assets/loginbackgroundvideos/*.mp4", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const VIDEO_SOURCES = Object.keys(videoModules)
  .sort()
  .map((path) => videoModules[path]!);

export function VideoBackdrop(): ReactElement {
  const { videoARef, videoBRef, activeSlot } = useVideoPool(VIDEO_SOURCES);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ground" aria-hidden="true">
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ${
          activeSlot === "a" ? "opacity-100" : "opacity-0"
        }`}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ${
          activeSlot === "b" ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal/35 via-sun/10 to-coral/35 mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-to-b from-ground/15 via-ground/5 to-ground/45" />
    </div>
  );
}
