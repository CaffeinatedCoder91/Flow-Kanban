// lib/ai.ts
// Helpers for extracting JSON from AI responses.

export function extractFirstJson(text: string): string | null {
  const start = text.search(/[[{]/)
  if (start === -1) return null

  const stack: string[] = []
  let inString = false
  let escaping = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaping) {
        escaping = false
        continue
      }
      if (ch === '\\') {
        escaping = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      stack.push('}')
    } else if (ch === '[') {
      stack.push(']')
    } else if (ch === '}' || ch === ']') {
      if (stack.length === 0) return null
      const expected = stack.pop()
      if (ch !== expected) return null
      if (stack.length === 0) return text.slice(start, i + 1)
    }
  }

  return null
}

export function parseJsonFromText<T>(text: string): T | null {
  const raw = extractFirstJson(text)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  return value.slice(0, maxChars)
}

export type TokenUsage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

function safeTokenCount(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num <= 0) return 0
  return Math.floor(num)
}

export function getTokenUsage(
  response: { usage?: { input_tokens?: number; output_tokens?: number } } | null | undefined
): TokenUsage {
  const inputTokens = safeTokenCount(response?.usage?.input_tokens)
  const outputTokens = safeTokenCount(response?.usage?.output_tokens)
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  }
}

export function sumTokenUsage(...usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (acc, usage) => ({
      inputTokens: acc.inputTokens + usage.inputTokens,
      outputTokens: acc.outputTokens + usage.outputTokens,
      totalTokens: acc.totalTokens + usage.totalTokens,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  )
}
