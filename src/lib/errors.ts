// src/lib/errors.ts
// Centralised user-facing error messages and a status-code-aware helper.
//
// NOTE: this app uses native fetch (not axios), so thrown errors do NOT have
// a .response property. Status codes come from the Response object itself.
// Use getApiErrorMessage(res.status, data.error) after checking !res.ok.

export const ERROR_MESSAGES = {
  NETWORK:    'Connection lost. Check your internet and try again.',
  SERVER:     'Failed to reach the server. Please try again.',
  RATE_LIMIT: 'Too many requests — please wait a moment and try again.',
  AI_OVERLOAD:'The AI is busy right now. Try again in a few seconds.',
  UNKNOWN:    'Something went wrong. Please try again.',
  FILE_TYPE:  'Unsupported file type. Please upload a .txt, .pdf, or .docx file.',
  FILE_SIZE:  'File is too large. Maximum size is 5 MB.',
} as const

/**
 * Maps an HTTP status code (from a non-ok Response) to a user-friendly message.
 * Falls back to the server's own error message, then to ERROR_MESSAGES.UNKNOWN.
 *
 * @param status      res.status from the failed Response
 * @param serverMsg   optional message already parsed from res.json().error
 */
export function getApiErrorMessage(status: number, serverMsg?: string): string {
  if (status === 429) return ERROR_MESSAGES.RATE_LIMIT
  if (status === 503 || status === 529) return ERROR_MESSAGES.AI_OVERLOAD
  return serverMsg ?? ERROR_MESSAGES.UNKNOWN
}
