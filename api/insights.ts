// api/insights.ts
// POST /api/insights — analyse the board and return typed insight objects.
//
// Insight types computed in JS (no AI): stale, bottleneck, priority_inflation, deadline_cluster.
// Duplicate detection uses Claude (semantic similarity).

import Anthropic from '@anthropic-ai/sdk'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import type { Item } from '../lib/supabase.js'
import { DuplicateGroupsSchema } from '../lib/validation.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type InsightType = 'stale' | 'bottleneck' | 'duplicate' | 'priority_inflation' | 'deadline_cluster'
type Severity = 'low' | 'medium' | 'high'

interface Insight {
  type: InsightType
  severity: Severity
  title: string
  description: string
  items: string[]  // item UUIDs
}

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const body = req.body as { items?: Item[] }
    if (!Array.isArray(body?.items)) {
      return badRequest(res, 'items must be an array')
    }

    const items: Item[] = body.items
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
        items: stale.map((i) => i.id),
      })
    }

    // ── Bottleneck ───────────────────────────────────────────────────────────
    const statusCounts: Record<string, Item[]> = {}
    for (const item of items) {
      if (!statusCounts[item.status]) statusCounts[item.status] = []
      statusCounts[item.status].push(item)
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
          items: statusItems.map((i) => i.id),
        })
      }
    }

    // ── Priority inflation ───────────────────────────────────────────────────
    const highPriority = items.filter((i) => i.priority === 'high' || i.priority === 'critical')
    if (items.length > 0 && highPriority.length / items.length >= 0.6) {
      insights.push({
        type: 'priority_inflation',
        severity: 'medium',
        title: 'Priority inflation detected',
        description: `${Math.round(highPriority.length / items.length * 100)}% of your tasks are high or critical priority — consider re-evaluating.`,
        items: highPriority.map((i) => i.id),
      })
    }

    // ── Deadline cluster ─────────────────────────────────────────────────────
    const upcoming = items
      .filter((i) => i.due_date && i.status !== 'done')
      .map((i) => ({ item: i, ts: new Date(i.due_date!).getTime() }))
      .sort((a, b) => a.ts - b.ts)

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
          items: cluster.map((c) => c.item.id),
        })
        i += cluster.length - 1  // skip past this cluster
        break
      }
    }

    // ── Semantic duplicates (AI) ─────────────────────────────────────────────
    if (items.length >= 2) {
      try {
        const itemList = items.map((i) =>
          `${i.id}: ${i.title}${i.description ? ` — ${i.description}` : ''}`
        ).join('\n')

        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
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

        const text = aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = DuplicateGroupsSchema.parse(JSON.parse(jsonMatch[0]))
          for (const group of parsed.groups) {
            if (group.length >= 2) {
              const dupeItems = group.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[]
              insights.push({
                type: 'duplicate',
                severity: 'low',
                title: `Possible duplicate tasks (${dupeItems.length})`,
                description: `These tasks may be about the same work: ${dupeItems.map((i) => `"${i.title}"`).join(', ')}`,
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
