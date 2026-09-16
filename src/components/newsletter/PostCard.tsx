/** One newsletter post: media gallery, reactions, and comments - shared by the manager's
 * Newsletters tab and the member-facing Academy Home feed.
 */

import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Post, PostComment, ReactionType } from "../../api/newsletterApi";
import {
  REACTION_TYPES,
  createComment,
  deleteComment,
  deletePost,
  listComments,
  removeReaction,
  setReaction,
  updatePost,
} from "../../api/newsletterApi";
import { formatPostBody } from "../../utils/postFormatting";
import { SmallButton } from "../ui/SmallButton";
import { PostActionsMenu } from "./PostActionsMenu";

const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

interface PostCardProps {
  subdomain: string;
  post: Post;
  currentUserId: number;
  /** Whether the current viewer is the academy's active manager (can moderate anyone's post/comment). */
  isManager: boolean;
  onChanged: (updated: Post) => void;
  onDeleted: (postId: number) => void;
}

export function PostCard({ subdomain, post, currentUserId, isManager, onChanged, onDeleted }: PostCardProps): ReactElement {
  const canModeratePost = isManager || post.author_id === currentUserId;
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const images = post.media.filter((item) => item.media_type === "image");
  const videos = post.media.filter((item) => item.media_type === "video");

  function handleReact(type: ReactionType): void {
    setError(null);
    const next = post.my_reaction === type ? null : type;
    const action = next ? setReaction(subdomain, post.id, type) : removeReaction(subdomain, post.id);
    action
      .then(() => {
        const counts = { ...post.reaction_counts };
        if (post.my_reaction) counts[post.my_reaction] -= 1;
        if (next) counts[next] += 1;
        onChanged({ ...post, my_reaction: next, reaction_counts: counts });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not react to that post."));
  }

  function handleSaveEdit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body = editDraft.trim();
    if (!body) return;

    setBusy(true);
    setError(null);
    updatePost(subdomain, post.id, body)
      .then((updated) => {
        onChanged(updated);
        setEditing(false);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save that post."))
      .finally(() => setBusy(false));
  }

  function handleDeletePost(): void {
    if (!window.confirm("Delete this post?")) return;
    setBusy(true);
    setError(null);
    deletePost(subdomain, post.id)
      .then(() => onDeleted(post.id))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not delete that post."))
      .finally(() => setBusy(false));
  }

  function toggleComments(): void {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      listComments(subdomain, post.id)
        .then((result) => setComments(result))
        .catch(() => setComments([]));
    }
  }

  function handleAddComment(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;

    setCommentBusy(true);
    createComment(subdomain, post.id, body)
      .then((comment) => {
        setComments((current) => [...(current ?? []), comment]);
        setCommentDraft("");
        onChanged({ ...post, comment_count: post.comment_count + 1 });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not add that comment."))
      .finally(() => setCommentBusy(false));
  }

  function handleDeleteComment(comment: PostComment): void {
    if (!window.confirm("Delete this comment?")) return;
    deleteComment(subdomain, post.id, comment.id)
      .then(() => {
        setComments((current) => (current ?? []).filter((c) => c.id !== comment.id));
        onChanged({ ...post, comment_count: Math.max(0, post.comment_count - 1) });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not delete that comment."));
  }

  return (
    <div className="rounded-[22px] border border-mint bg-white/40 p-5 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-xs font-bold text-white">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="size-full object-cover" />
            ) : (
              `${post.author_first_name.charAt(0)}${post.author_last_name.charAt(0)}`.toUpperCase()
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-black">
              {post.author_first_name} {post.author_last_name}
            </p>
            <p className="text-xs text-black/40">{formatDateTime(post.created_at)}</p>
          </div>
        </div>

        {canModeratePost && !editing && (
          <PostActionsMenu
            onEdit={() => {
              setEditDraft(post.body);
              setEditing(true);
            }}
            onDelete={handleDeletePost}
          />
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} className="mt-3 flex flex-col gap-2">
          <textarea
            value={editDraft}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setEditDraft(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black focus:border-pine focus:outline-none"
          />
          <div className="flex gap-2">
            <SmallButton type="submit" variant="primary" disabled={busy || !editDraft.trim()}>
              Save
            </SmallButton>
            <SmallButton type="button" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </SmallButton>
          </div>
        </form>
      ) : (
        <p
          className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/80"
          dangerouslySetInnerHTML={{ __html: formatPostBody(post.body) }}
        />
      )}

      {images.length === 1 && (
        <a href={images[0]!.file} target="_blank" rel="noreferrer" className="mt-3 block">
          <img
            src={images[0]!.file}
            alt=""
            className="max-h-[480px] w-full rounded-xl border border-mint/50 object-cover"
          />
        </a>
      )}

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((item) => (
            <a key={item.id} href={item.file} target="_blank" rel="noreferrer" className="block">
              <img src={item.file} alt="" className="aspect-square w-full rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}

      {videos.map((item) => (
        <video key={item.id} src={item.file} controls className="mt-3 w-full rounded-lg" />
      ))}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-mint pt-3">
        <div className="flex flex-wrap gap-2">
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleReact(type)}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-bold transition-colors ${
                post.my_reaction === type
                  ? "border-mint bg-mint text-white"
                  : "border-mint/40 bg-white text-black/60 hover:border-mint hover:bg-mint/15"
              }`}
            >
              <span>{REACTION_EMOJI[type]}</span>
              {post.reaction_counts[type] > 0 && (
                <span className="text-xs">{post.reaction_counts[type]}</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleComments}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-mint/40 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-black/60 transition-colors hover:border-mint hover:bg-mint/15 hover:text-black"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
            <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.3A1 1 0 0 1 3 19.5V5a1 1 0 0 1 1-1Z" />
          </svg>
          {post.comment_count} comment{post.comment_count === 1 ? "" : "s"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-mint pt-3">
          {comments === null && <p className="text-sm text-gray-500">Loading…</p>}
          {comments?.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-2 text-sm">
              <p>
                <span className="font-semibold text-black">
                  {comment.author_first_name} {comment.author_last_name}
                </span>{" "}
                <span className="text-black/70">{comment.body}</span>
              </p>
              {(isManager || comment.author_id === currentUserId) && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment)}
                  className="shrink-0 text-xs text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          <form onSubmit={handleAddComment} className="mt-1 flex gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCommentDraft(event.target.value)}
              placeholder="Write a comment…"
              className="w-full rounded-lg border border-mint bg-white px-3 py-1.5 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
            />
            <SmallButton type="submit" variant="primary" disabled={commentBusy || !commentDraft.trim()}>
              Post
            </SmallButton>
          </form>
        </div>
      )}
    </div>
  );
}
