/** Minimal, safe **bold** / *italic* formatting for newsletter post bodies and comments.
 *
 * User text is HTML-escaped first, then only `**bold**` and `*italic*` markers (inserted by
 * the composer's toolbar, see PostFeed.tsx) are turned into real tags - nothing else about
 * the input is ever treated as HTML, so this is safe to render via dangerouslySetInnerHTML.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escape a post/comment body and apply bold/italic markup.
 *
 * @param body - The raw, user-typed text (may contain `**bold**` and/or `*italic*` markers).
 * @returns HTML-safe markup with `<strong>`/`<em>` tags substituted in.
 */
export function formatPostBody(body: string): string {
  const escaped = escapeHtml(body);
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return bolded.replace(/\*(.+?)\*/g, "<em>$1</em>");
}
