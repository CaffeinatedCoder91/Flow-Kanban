/**
 * lib/sanitize.ts
 *
 * Sanitization helpers that work in both environments:
 *   - Browser (React components)     → DOMPurify
 *   - Node.js (Vercel serverless)     → regex tag-strip (no DOM available)
 *
 * Usage in API routes (server):
 *   import { sanitizePlainText } from '../lib/sanitize'
 *   const title = sanitizePlainText(req.body.title)
 *
 * Usage in React (when dangerouslySetInnerHTML is needed):
 *   import { sanitizeHtml } from '../lib/sanitize'
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 */

// ─── Tag-strip regex fallback (Node.js / no-DOM) ──────────────────────────────

/** Remove all HTML/XML tags and normalise whitespace. */
function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')   // remove tags
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim()
}

// ─── Plain-text sanitizer ──────────────────────────────────────────────────────

/**
 * Strip ALL markup from a value that should always be plain text.
 * Use this for: title, assignee, color, due_date.
 * Works in both Node.js and browser.
 */
export function sanitizePlainText(value: string | null | undefined): string {
  if (!value) return ''

  if (typeof window !== 'undefined') {
    // Browser: use DOMPurify with no allowed tags
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('dompurify')
    const DOMPurify = mod.default ?? mod
    return (DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as string).trim()
  }

  return stripTags(value)
}

// ─── Rich-text / HTML sanitizer ───────────────────────────────────────────────

/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Allows a small whitelist of safe tags (bold, links, lists, code).
 * Falls back to full tag-strip on the server.
 *
 * @example
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }} />
 */
export function sanitizeHtml(value: string | null | undefined): string {
  if (!value) return ''

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('dompurify')
    const DOMPurify = mod.default ?? mod
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    }) as string
  }

  return stripTags(value)
}

// ─── Item field sanitizer ──────────────────────────────────────────────────────

/**
 * Sanitize all user-supplied text fields on an item payload.
 * Call this in API routes before writing to the database.
 */
export function sanitizeItemFields<
  T extends {
    title?: string | null
    description?: string | null
    assignee?: string | null
    color?: string | null
  },
>(data: T): T {
  const result = { ...data }

  if (result.title != null)       result.title       = sanitizePlainText(result.title)
  if (result.description != null) result.description = sanitizePlainText(result.description)
  if (result.assignee != null)    result.assignee    = sanitizePlainText(result.assignee)
  if (result.color != null)       result.color       = sanitizePlainText(result.color)

  return result
}
