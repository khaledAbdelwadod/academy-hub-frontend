/** API layer for a member's in-app notifications (the nav bell). */

import { apiRequest } from "./apiClient";

export type NotificationKind = "event_invited" | "event_updated" | "event_cancelled";

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  actor_first_name: string;
  actor_last_name: string;
  /** The event it's about, or null once that event has been deleted (e.g. a cancellation). */
  event: number | null;
  event_title: string;
  /** ISO datetime (UTC) of the event's start when the notification was made. */
  event_start: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationList {
  unread_count: number;
  results: AppNotification[];
}

function notificationsPath(subdomain: string, suffix = ""): string {
  return `/api/academies/${subdomain}/notifications/${suffix}`;
}

/**
 * Load the viewer's latest notifications at an academy, plus how many are unread.
 *
 * @param subdomain - The academy's subdomain.
 * @returns The unread count and the newest notifications first.
 * @throws {ApiError} If the request fails.
 */
export async function listNotifications(subdomain: string): Promise<NotificationList> {
  const response = await apiRequest("GET", notificationsPath(subdomain), {
    fallbackError: "Could not load notifications.",
  });
  return (await response.json()) as NotificationList;
}

/**
 * Mark one notification as read.
 *
 * @param subdomain - The academy's subdomain.
 * @param notificationId - The notification's id.
 * @throws {ApiError} If the request fails.
 */
export async function markNotificationRead(subdomain: string, notificationId: number): Promise<void> {
  await apiRequest("POST", notificationsPath(subdomain, `${notificationId}/read/`), {
    fallbackError: "Could not update that notification.",
  });
}

/**
 * Mark every notification at an academy as read.
 *
 * @param subdomain - The academy's subdomain.
 * @throws {ApiError} If the request fails.
 */
export async function markAllNotificationsRead(subdomain: string): Promise<void> {
  await apiRequest("POST", notificationsPath(subdomain, "read-all/"), {
    fallbackError: "Could not update your notifications.",
  });
}
