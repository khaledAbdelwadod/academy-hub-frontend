/** API layer for academy newsletter posts: authoring, media, comments, and reactions. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "angry";

export const REACTION_TYPES: ReactionType[] = ["like", "love", "laugh", "wow", "sad", "angry"];

export interface PostMedia {
  id: number;
  media_type: "image" | "video";
  file: string;
  order: number;
}

export interface Post {
  id: number;
  author_id: number;
  author_first_name: string;
  author_last_name: string;
  author_avatar: string | null;
  body: string;
  media: PostMedia[];
  comment_count: number;
  reaction_counts: Record<ReactionType, number>;
  my_reaction: ReactionType | null;
  created_at: string;
  updated_at: string;
}

export interface PostList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}

export interface PostComment {
  id: number;
  author_id: number;
  author_first_name: string;
  author_last_name: string;
  author_avatar: string | null;
  body: string;
  created_at: string;
}

export interface PostCommentList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PostComment[];
}

export class NewsletterError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new NewsletterError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.join(" ");
  }
  return fallback;
}

function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

/**
 * List an academy's newsletter posts (paginated), for any active member.
 *
 * @param subdomain - The academy's subdomain.
 * @param url - Optional full URL (from a previous response's `next`/`previous`) to page through results.
 * @returns A page of posts.
 * @throws {NewsletterError} If the request fails.
 */
export async function listPosts(subdomain: string, url?: string): Promise<PostList> {
  const response = await fetch(url ?? `${API_BASE_URL}/api/academies/${subdomain}/posts/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new NewsletterError("Could not load posts.");
  }
  return (await response.json()) as PostList;
}

/**
 * Create a new post (manager/admin only).
 *
 * @param subdomain - The academy's subdomain.
 * @param body - The post's text.
 * @returns The created post.
 * @throws {NewsletterError} If the request is invalid or fails.
 */
export async function createPost(subdomain: string, body: string): Promise<Post> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not create that post."));
  }
  return (await response.json()) as Post;
}

/**
 * Edit a post's text (the author or the academy's manager).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param body - The new text.
 * @returns The updated post.
 * @throws {NewsletterError} If the request is invalid or fails.
 */
export async function updatePost(subdomain: string, postId: number, body: string): Promise<Post> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not save that post."));
  }
  return (await response.json()) as Post;
}

/**
 * Delete a post (the author or the academy's manager).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @throws {NewsletterError} If the request fails.
 */
export async function deletePost(subdomain: string, postId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not delete that post."));
  }
}

/**
 * Upload one photo or video to a post (the author or the academy's manager).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param file - The image or video file.
 * @returns The new media item.
 * @throws {NewsletterError} If the request is invalid or fails.
 */
export async function uploadPostMedia(subdomain: string, postId: number, file: File): Promise<PostMedia> {
  const csrfToken = await fetchCsrfToken();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/media/`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
    body: formData,
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not upload that file."));
  }
  return (await response.json()) as PostMedia;
}

/**
 * Remove one photo/video from a post (the author or the academy's manager).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param mediaId - The media item's id.
 * @throws {NewsletterError} If the request fails.
 */
export async function deletePostMedia(subdomain: string, postId: number, mediaId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/media/${mediaId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not remove that file."));
  }
}

/**
 * List a post's comments, for any active member.
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @returns The post's comments, oldest first.
 * @throws {NewsletterError} If the request fails.
 */
export async function listComments(subdomain: string, postId: number): Promise<PostComment[]> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/comments/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new NewsletterError("Could not load comments.");
  }
  const data = (await response.json()) as PostComment[] | PostCommentList;
  return unwrapList(data);
}

/**
 * Add a comment to a post (any active member).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param body - The comment's text.
 * @returns The created comment.
 * @throws {NewsletterError} If the request is invalid or fails.
 */
export async function createComment(subdomain: string, postId: number, body: string): Promise<PostComment> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/comments/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not add that comment."));
  }
  return (await response.json()) as PostComment;
}

/**
 * Delete a comment (the comment's author or the academy's manager).
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param commentId - The comment's id.
 * @throws {NewsletterError} If the request fails.
 */
export async function deleteComment(subdomain: string, postId: number, commentId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(
    `${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/comments/${commentId}/`,
    { method: "DELETE", credentials: "include", headers: { "X-CSRFToken": csrfToken } },
  );
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not delete that comment."));
  }
}

/**
 * Set (or change) the current user's reaction to a post.
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @param reactionType - The reaction to set.
 * @throws {NewsletterError} If the request fails.
 */
export async function setReaction(subdomain: string, postId: number, reactionType: ReactionType): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/reaction/`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ reaction_type: reactionType }),
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not react to that post."));
  }
}

/**
 * Remove the current user's reaction to a post, if any.
 *
 * @param subdomain - The academy's subdomain.
 * @param postId - The post's id.
 * @throws {NewsletterError} If the request fails.
 */
export async function removeReaction(subdomain: string, postId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/posts/${postId}/reaction/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new NewsletterError(await readErrorDetail(response, "Could not remove your reaction."));
  }
}
