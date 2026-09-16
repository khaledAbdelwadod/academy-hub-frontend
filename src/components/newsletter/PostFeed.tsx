/** A newsletter feed: an optional "new post" composer (manager/admin) plus the post list. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Post, PostList } from "../../api/newsletterApi";
import { createPost, listPosts, uploadPostMedia } from "../../api/newsletterApi";
import { logger } from "../../utils/logger";
import { SmallButton } from "../ui/SmallButton";
import { PostCard } from "./PostCard";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; page: PostList };

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
        <div className="rounded-[22px] border border-mint bg-white/40 p-5 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6">
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <textarea
              value={composerBody}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComposerBody(event.target.value)}
              placeholder="Share news with your academy…"
              rows={3}
              className="w-full rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
            />
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setComposerFiles(Array.from(event.target.files ?? []))
              }
              className="text-sm text-black/60"
            />
            {composerFiles.length > 0 && (
              <p className="text-xs text-black/50">{composerFiles.length} file(s) selected</p>
            )}
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
