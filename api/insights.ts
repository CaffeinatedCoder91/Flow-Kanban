// api/insights.ts
// POST /api/insights — analyse the board and return typed insight objects.
//
// Insight types computed in JS (no AI): stale, bottleneck, priority_inflation, deadline_cluster.
// Duplicate detection uses Claude (semantic similarity).

import Anthropic from '@anthropic-ai/sdk'
import { withCors, getClientIp, getUserContext, enforceJsonBodyLimit, requireJson, unauthorized, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, ipRateLimit } from '../lib/rateLimit.js'
import type { Item } from '../lib/supabase.js'
import { DuplicateGroupsSchema } from '../lib/validation.js'
import { getItems, getItemsWithDueDate } from '../lib/db.js'
import { parseDateOnly, startOfToday } from '../lib/date.js'
import { parseJsonFromText, truncateText, getTokenUsage } from '../lib/ai.js'
import { checkDailyBudget, checkIpDailyBudget, recordDailyUsage, recordIpDailyUsage } from '../lib/usage.js'
import { withAiCache } from '../lib/aiCache.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_DUPLICATE_ITEMS = 200
const MAX_DESC_CHARS = 100

type InsightType = 'stale' | 'bottleneck' | 'duplicate' | 'priority_inflation' | 'deadline_cluster'
type Severity = 'low' | 'medium' | 'high'

interface Insight {
  type: InsightType
  severity: Severity
  title: string
  description: string
  items: string[]  // item UUIDs
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenSet(value: string): Set<string> {
  const tokens = normalizeText(value).split(' ').filter(token => token.length >= 3)
  return new Set(tokens)
}

function titlesMatch(a: Item, b: Item): boolean {
  return normalizeText(a.title) === normalizeText(b.title)
}

function jaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const token of setA) {
    if (setB.has(token)) intersection += 1
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userContext = await getUserContext(req)
  if (!userContext) return unauthorized(res)
  const { userId, isDemo } = userContext
  const ip = getClientIp(req)
  if (ip && !await checkRateLimit(res, `ip:${ip}`, ipRateLimit)) return
  if (!await checkRateLimit(res, userId)) return

  try {
    if (!requireJson(req, res)) return
    if (!enforceJsonBodyLimit(req, res)) return
    const items: Item[] = await getItems(userId)
    const insights: Insight[] = []
    const now = new Date()

    // ── Stale ────────────────────────────────────────────────────────────────
    const stale = items.filter((i) => {
      if (i.status !== 'in_progress') return false
      const modified = new Date(i.last_modified)
      return (now.getTime() - modified.getTime()) > 7 * 24 * 60 * 60 * 1000
    })

    if (stale.length > 0) {
      const severity: Severity = stale.length >= 5 ? 'high' : stale.length >= 3 ? 'medium' : 'low'
      insights.push({
        type: 'stale',
        severity,
        title: `${stale.length} stale in-progress task${stale.length > 1 ? 's' : ''}`,
        description: `${stale.length} task${stale.length > 1 ? 's have' : ' has'} been in progress for over a week without any updates.`,
        items: stale.map((item) => item.id),
      })
    }

    // ── Bottleneck ───────────────────────────────────────────────────────────
    const statuses = ['not_started', 'in_progress', 'stuck']
    const statusCounts: Record<string, Item[]> = {}
    for (const status of statuses) {
      const statusItems = await getItems(userId, { status })
      if (statusItems.length > 0) statusCounts[status] = statusItems
    }

    for (const [status, statusItems] of Object.entries(statusCounts)) {
      if (statusItems.length < 5) continue
      const others = Object.entries(statusCounts)
        .filter(([s]) => s !== status)
        .map(([, arr]) => arr.length)
      const maxOther = others.length ? Math.max(...others) : 0
      if (statusItems.length >= maxOther * 3) {
        const severity: Severity = statusItems.length >= 8 ? 'high' : 'medium'
        insights.push({
          type: 'bottleneck',
          severity,
          title: `Bottleneck in "${status}"`,
          description: `${statusItems.length} tasks are piled up in "${status}", which is 3× more than any other column.`,
          items: statusItems.map((item) => item.id),
        })
      }
    }

    // ── Priority inflation ───────────────────────────────────────────────────
    const highPriority = items.filter((item) => item.priority === 'high' || item.priority === 'critical')
    if (items.length > 0 && highPriority.length / items.length >= 0.6) {
      insights.push({
        type: 'priority_inflation',
        severity: 'medium',
        title: 'Priority inflation detected',
        description: `${Math.round(highPriority.length / items.length * 100)}% of your tasks are high or critical priority — consider re-evaluating.`,
        items: highPriority.map((item) => item.id),
      })
    }

    // ── Deadline cluster ─────────────────────────────────────────────────────
    const today = startOfToday()
    const twoWeeksOut = new Date(today)
    twoWeeksOut.setDate(today.getDate() + 14)
    const upcomingItems = await getItemsWithDueDate(userId, today, twoWeeksOut)
    const upcoming = upcomingItems
      .map((item) => ({ item, ts: parseDateOnly(item.due_date!).getTime() }))

    for (let i = 0; i < upcoming.length; i++) {
      const cluster = [upcoming[i]]
      for (let j = i + 1; j < upcoming.length; j++) {
        if (upcoming[j].ts - upcoming[i].ts <= 2 * 24 * 60 * 60 * 1000) {
          cluster.push(upcoming[j])
        } else break
      }
      if (cluster.length >= 3) {
        const severity: Severity = cluster.length >= 5 ? 'high' : 'medium'
        insights.push({
          type: 'deadline_cluster',
          severity,
          title: `${cluster.length} deadlines in a 2-day window`,
          description: `${cluster.length} tasks are due within 2 days of each other — this may be overwhelming.`,
          items: cluster.map((clusterItem) => clusterItem.item.id),
        })
        i += cluster.length - 1  // skip past this cluster
        break
      }
    }

    // ── Semantic duplicates (AI) ─────────────────────────────────────────────
    if (items.length >= 2) {
      const aiItems = [...items]
        .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime())
        .slice(0, MAX_DUPLICATE_ITEMS)

      const tokenized = aiItems.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description ?? '',
        tokens: tokenSet(`${i.title} ${i.description ?? ''}`),
      }))

      let hasNearDuplicate = false
      for (let i = 0; i < tokenized.length; i++) {
        for (let j = i + 1; j < tokenized.length; j++) {
          const itemA = items.find(x => x.id === tokenized[i].id)
          const itemB = items.find(x => x.id === tokenized[j].id)
          if (itemA && itemB && titlesMatch(itemA, itemB)) {
            hasNearDuplicate = true
            break
          }
          if (jaccard(tokenized[i].tokens, tokenized[j].tokens) >= 0.8) {
            hasNearDuplicate = true
            break
          }
        }
        if (hasNearDuplicate) break
      }

      if (!hasNearDuplicate) {
        res.status(200).json({ insights })
        return
      }

      try {
        const budget = await checkDailyBudget(userId, { isDemo })
        if (!budget.allowed) {
          return res.status(429).json({ error: 'Daily AI limit reached', reset: budget.reset })
        }
        if (ip) {
          const ipBudget = await checkIpDailyBudget(ip, { isDemo })
          if (!ipBudget.allowed) {
            return res.status(429).json({ error: 'Daily IP AI limit reached', reset: ipBudget.reset })
          }
        }

        const itemIds = aiItems.map(i => i.id).sort()

        const { aiRes, tokenUsage } = await withAiCache({
          userId,
          endpoint: 'insights',
          inputs: { itemIds },
          isDemo,
          fn: async () => {
            const itemList = aiItems.map((item) =>
              `${item.id}: ${truncateText(item.title, 120)}${item.description ? ` — ${truncateText(item.description, MAX_DESC_CHARS)}` : ''}`
            ).join('\n')

            const aiRes = await anthropic.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1024,
              messages: [
                {
                  role: 'user',
                  content: `Identify groups of semantically duplicate or very similar tasks from this list.
Only flag tasks that are clearly about the same work. Return ONLY valid JSON.

Tasks:
${itemList}

Return format: {"groups": [["uuid1", "uuid2"], ...]}
If no duplicates, return {"groups": []}`,
                },
              ],
            })
            const tokenUsage = getTokenUsage(aiRes)
            return { aiRes, tokenUsage }
          },
        })

        await recordDailyUsage(userId, tokenUsage)
        if (ip) await recordIpDailyUsage(ip, tokenUsage)

        const textBlocks = aiRes.content.filter((block): block is Anthropic.TextBlock => block.type === 'text')
        const raw = textBlocks.map(block => block.text).join('')
        const parsedRaw = parseJsonFromText<unknown>(raw)
        if (parsedRaw) {
          const parsed = DuplicateGroupsSchema.parse(parsedRaw)
          for (const group of parsed.groups) {
            if (group.length >= 2) {
              const dupeItems = group.map((id) => items.find((item) => item.id === id)).filter(Boolean) as Item[]
              let maxSim = 0
              let anyTitleMatch = false
              for (let i = 0; i < dupeItems.length; i++) {
                for (let j = i + 1; j < dupeItems.length; j++) {
                  if (titlesMatch(dupeItems[i], dupeItems[j])) {
                    anyTitleMatch = true
                  }
                  const tokenSetA = tokenSet(`${dupeItems[i].title} ${dupeItems[i].description ?? ''}`)
                  const tokenSetB = tokenSet(`${dupeItems[j].title} ${dupeItems[j].description ?? ''}`)
                  maxSim = Math.max(maxSim, jaccard(tokenSetA, tokenSetB))
                }
              }
              if (!anyTitleMatch && maxSim < 0.85) continue
              insights.push({
                type: 'duplicate',
                severity: 'low',
                title: `Possible duplicate tasks (${dupeItems.length})`,
                description: `These tasks may be about the same work: ${dupeItems.map((item) => `"${item.title}"`).join(', ')}`,
                items: group,
              })
            }
          }
        }
      } catch {
        // Duplicate detection is best-effort; don't fail the whole request
      }
    }

    res.status(200).json({ insights })
  } catch (err) {
    serverError(res, err)
  }
})
