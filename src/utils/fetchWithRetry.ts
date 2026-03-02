const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxAttempts = 3,
  baseDelayMs = 300,
): Promise<Response> {
  let attempt = 0
  while (true) {
    try {
      const res = await fetch(input, init)
      if (!RETRYABLE.has(res.status) || attempt >= maxAttempts - 1) return res
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 100)
      attempt++
    } catch (err) {
      if (attempt >= maxAttempts - 1) throw err
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 100)
      attempt++
    }
  }
}
