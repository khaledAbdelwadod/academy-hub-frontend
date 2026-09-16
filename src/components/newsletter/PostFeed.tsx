/** A newsletter feed: an optional "new post" composer (manager/admin) plus the post list. */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Post, PostList } from "../../api/newsletterApi";
import { createPost, listPosts, uploadPostMedia } from "../../api/newsletterApi";
import { logger } from "../../utils/logger";
import { SmallButton } from "../ui/SmallButton";
import { PostCard } from "./PostCard";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; page: PostList };

const EMOJI_OPTIONS = [
  "😊", "😂", "😍", "🤩", "🥳", "😢", "😮", "🙏",
  "👍", "👏", "🙌", "💪", "❤️", "🔥", "✨", "💯",
  "⚽", "🏆", "🥇", "🏅", "🎯", "📣", "📅", "✅",
];

interface PostFeedProps {
  subdomain: string;
  currentUserId: number;
  isManager: boolean;
  /** Whether the current viewer may create new posts (manager or admin). */
  canPost: boolean;
}

export function PostFeed({ subdomain, currentUserId, isManager, canPost }: PostFeedProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [composerBody, setComposerBody] = useState("");
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function removeSelectedFile(index: number): void {
    setComposerFiles((current) => current.filter((_, i) => i !== index));
  }

  /** Wrap the textarea's current selection (or insert placeholder markers at the cursor). */
  function wrapSelection(marker: string): void {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = composerBody.slice(start, end) || "text";
    const next = `${composerBody.slice(0, start)}${marker}${selected}${marker}${composerBody.slice(end)}`;
    setComposerBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + marker.length + selected.length + marker.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertEmoji(emoji: string): void {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? composerBody.length;
    const end = textarea?.selectionEnd ?? composerBody.length;
    const next = `${composerBody.slice(0, start)}${emoji}${composerBody.slice(end)}`;
    setComposerBody(next);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + emoji.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  function load(url?: string): void {
    listPosts(subdomain, url)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load posts.";
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  function handlePost(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body = composerBody.trim();
    if (!body) return;

    setPosting(true);
    setComposerError(null);
    createPost(subdomain, body)
      .then(async (post) => {
        for (const file of composerFiles) {
          await uploadPostMedia(subdomain, post.id, file);
        }
        setComposerBody("");
        setComposerFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        load();
      })
      .catch((error: unknown) => {
        logger.error("Failed to create post", { error: error instanceof Error ? error.message : error });
        setComposerError(error instanceof Error ? error.message : "Could not create that post.");
      })
      .finally(() => setPosting(false));
  }

  function handlePostChanged(updated: Post): void {
    setState((current) =>
      current.status === "ready"
        ? {
            status: "ready",
            page: { ...current.page, results: current.page.results.map((p) => (p.id === updated.id ? updated : p)) },
          }
        : current,
    );
  }

  function handlePostDeleted(postId: number): void {
    setState((current) =>
      current.status === "ready"
        ? { status: "ready", page: { ...current.page, results: current.page.results.filter((p) => p.id !== postId) } }
        : current,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canPost && (
        <div className="rounded-[22px] border border-mint bg-white/40 p-5 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl sm:p-6">
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={composerBody}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComposerBody(event.target.value)}
              placeholder="Share news with your academy…"
              rows={3}
              className="w-full rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => wrapSelection("**")}
                aria-label="Bold"
                title="Bold"
                className="rounded-lg border border-mint bg-white px-2.5 py-1.5 text-xs font-extrabold text-black/70 transition-colors hover:bg-mint/15"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("*")}
                aria-label="Italic"
                title="Italic"
                className="rounded-lg border border-mint bg-white px-2.5 py-1.5 text-xs italic text-black/70 transition-colors hover:bg-mint/15"
              >
                I
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((current) => !current)}
                  aria-label="Add emoji"
                  title="Add emoji"
                  className="rounded-lg border border-mint bg-white px-2.5 py-1.5 text-sm transition-colors hover:bg-mint/15"
                >
                  🙂
                </button>
                {showEmojiPicker && (
                  <>
                    <button
                      type="button"
                      aria-label="Close emoji picker"
                      onClick={() => setShowEmojiPicker(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div className="absolute left-0 top-[calc(100%+6px)] z-20 grid w-64 grid-cols-8 gap-1 rounded-xl border border-mint bg-white p-2 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)]">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="rounded-md p-1 text-base transition-colors hover:bg-mint/15"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-mint bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-black/80 transition-colors hover:bg-mint/15"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                    <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" />
                  </svg>
                  Add photos/video
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setComposerFiles(Array.from(event.target.files ?? []))
                  }
                  className="hidden"
                />
              </div>

              {composerFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {composerFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-1.5 rounded-full border border-mint bg-white px-2.5 py-1 text-xs text-black/70"
                    >
                      {file.name}
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-black/40 hover:text-red-500"
                        aria-label={`Remove ${file.name}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {composerError && <p className="text-sm text-red-400">{composerError}</p>}
            <SmallButton type="submit" variant="primary" disabled={posting || !composerBody.trim()}>
              {posting ? "Posting…" : "Post"}
            </SmallButton>
          </form>
        </div>
      )}

      {state.status === "loading" && (
        <p className="text-center text-sm text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">Loading…</p>
      )}
      {state.status === "error" && (
        <p className="text-center text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{state.message}</p>
      )}
      {state.status === "ready" && state.page.results.length === 0 && (
        <p className="text-center text-sm text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">No posts yet.</p>
      )}

      {state.status === "ready" &&
        state.page.results.map((post) => (
          <PostCard
            key={post.id}
            subdomain={subdomain}
            post={post}
            currentUserId={currentUserId}
            isManager={isManager}
            onChanged={handlePostChanged}
            onDeleted={handlePostDeleted}
          />
        ))}

      {state.status === "ready" && (state.page.next || state.page.previous) && (
        <div className="flex justify-center gap-2">
          <SmallButton
            disabled={!state.page.previous}
            onClick={() => state.page.previous && load(state.page.previous)}
          >
            Previous
          </SmallButton>
          <SmallButton disabled={!state.page.next} onClick={() => state.page.next && load(state.page.next)}>
            Next
          </SmallButton>
        </div>
      )}
    </div>
  );
}
