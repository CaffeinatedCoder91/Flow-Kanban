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
