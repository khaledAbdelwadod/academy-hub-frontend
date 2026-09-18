/** The nav's bell: an unread badge and a dropdown of the member's latest notifications. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type { AppNotification, NotificationKind, NotificationList } from "../../api/notificationApi";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notificationApi";
import { formatDateTime } from "../../utils/calendarDates";
import { logger } from "../../utils/logger";

const POLL_INTERVAL_MS = 60_000;
/** Largest unread count shown as a number; anything above reads "9+". */
const MAX_BADGE_COUNT = 9;

const KIND_TEXT: Record<NotificationKind, string> = {
  event_invited: "invited you to",
  event_updated: "changed the time of",
  event_cancelled: "cancelled",
};

interface NotificationBellProps {
  subdomain: string;
  /** Called when a notification about a still-existing event is clicked. */
  onOpenNotification: (notification: AppNotification) => void;
}

function BellIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: () => void;
}): ReactElement {
  const actor = `${notification.actor_first_name} ${notification.actor_last_name}`.trim() || "Someone";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-mint/30 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-mint/15"
    >
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.is_read ? "bg-transparent" : "bg-mint"}`} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-sm text-black ${notification.is_read ? "" : "font-semibold"}`}>
          {actor} {KIND_TEXT[notification.kind]} “{notification.event_title}”
        </span>
        <span className="text-xs text-black/55">{formatDateTime(notification.event_start)}</span>
      </span>
    </button>
  );
}

export function NotificationBell({ subdomain, onOpenNotification }: NotificationBellProps): ReactElement {
  const [list, setList] = useState<NotificationList | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    listNotifications(subdomain)
      .then(setList)
      .catch((error: unknown) => logger.warn("Failed to load notifications", { error }));
  }, [subdomain]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggleOpen(): void {
    if (!open) refresh();
    setOpen((isOpen) => !isOpen);
  }

  function handleRowClick(notification: AppNotification): void {
    if (!notification.is_read) {
      setList((current) =>
        current
          ? {
              unread_count: Math.max(current.unread_count - 1, 0),
              results: current.results.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
            }
          : current,
      );
      markNotificationRead(subdomain, notification.id).catch((error: unknown) =>
        logger.warn("Failed to mark notification read", { error }),
      );
    }
    setOpen(false);
    if (notification.event !== null) onOpenNotification(notification);
  }

  function handleMarkAllRead(): void {
    setList((current) =>
      current ? { unread_count: 0, results: current.results.map((item) => ({ ...item, is_read: true })) } : current,
    );
    markAllNotificationsRead(subdomain).catch((error: unknown) =>
      logger.warn("Failed to mark notifications read", { error }),
    );
  }

  const unreadCount = list?.unread_count ?? 0;

  return (
    <div ref={containerRef} className="sm:relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onClick={toggleOpen}
        className="relative flex size-9 items-center justify-center rounded-full text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-xl border border-mint bg-white/95 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:right-0 sm:w-96">
          <div className="flex items-center justify-between border-b border-mint px-4 py-3">
            <span className="text-sm font-bold text-black">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold uppercase tracking-wide text-mint hover:text-pine"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {list === null && <p className="px-4 py-6 text-center text-sm text-black/50">Loading…</p>}
            {list?.results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-black/50">You&apos;re all caught up.</p>
            )}
            {list?.results.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={() => handleRowClick(notification)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
