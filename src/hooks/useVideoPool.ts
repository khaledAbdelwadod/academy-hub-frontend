/** Cycles two <video> elements through a list of sources, one playing while the next loads. */

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface VideoPool {
  videoARef: RefObject<HTMLVideoElement | null>;
  videoBRef: RefObject<HTMLVideoElement | null>;
  activeSlot: "a" | "b";
}

export function useVideoPool(sources: string[]): VideoPool {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");

  useEffect(() => {
    const elA = videoARef.current;
    const elB = videoBRef.current;
    if (!elA || !elB || sources.length === 0) {
      return undefined;
    }

    const slots = [elA, elB];
    let sourceIndex = 0;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function playSlot(slotIndex: number): void {
      setActiveSlot(slotIndex === 0 ? "a" : "b");
      const el = slots[slotIndex];
      if (!el) return;
      el.currentTime = 0;
      if (!prefersReducedMotion) {
        void el.play();
      }
    }

    function advance(finishedSlotIndex: number): void {
      sourceIndex = (sourceIndex + 1) % sources.length;
      const nextSlotIndex = (finishedSlotIndex + 1) % slots.length;
      const nextEl = slots[nextSlotIndex];
      const nextSource = sources[sourceIndex];
      if (!nextEl || !nextSource) return;

      nextEl.src = nextSource;
      nextEl.load();
      nextEl.addEventListener(
        "canplay",
        () => {
          playSlot(nextSlotIndex);
        },
        { once: true },
      );
    }

    const onEndedA = (): void => advance(0);
    const onEndedB = (): void => advance(1);
    elA.addEventListener("ended", onEndedA);
    elB.addEventListener("ended", onEndedB);

    const firstSource = sources[0];
    if (firstSource) {
      elA.src = firstSource;
      elA.addEventListener(
        "canplay",
        () => {
          playSlot(0);
        },
        { once: true },
      );
    }
    const secondSource = sources[1];
    if (secondSource) {
      elB.src = secondSource;
      elB.load();
    }

    return () => {
      elA.removeEventListener("ended", onEndedA);
      elB.removeEventListener("ended", onEndedB);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sources is a stable static list
  }, [sources.join("|")]);

  return { videoARef, videoBRef, activeSlot };
}
