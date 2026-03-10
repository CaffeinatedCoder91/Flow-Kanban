// lib/db.ts
// Database helper functions for Flow Kanban — Supabase.
// All functions require userId to scope queries to the authenticated user.
// Uses supabaseAdmin (service role) so RLS is bypassed — userId filtering
// is enforced explicitly in every query.

import { supabaseAdmin, Item, ItemHistory } from './supabase.js'

// ─── Items ────────────────────────────────────────────────────────────────────

/**
 * Fetch all items for a user.
 * Optionally filter by status and/or priority.
 */
export async function getItems(
  userId: string,
  filters?: { status?: string; priority?: string }
): Promise<Item[]> {
  try {
    let query = supabaseAdmin
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (filters?.status)   query = query.eq('status', filters.status)
    if (filters?.priority) query = query.eq('priority', filters.priority)

    const { data, error } = await query
    if (error) throw new Error(`getItems failed: ${error.message}`)
    return (data ?? []) as Item[]
  } catch (err) {
    console.error('[db] getItems error:', err)
    throw err
  }
}

/**
 * Fetch a single item by id, scoped to the user.
 * Returns null if not found or belongs to a different user.
 */
export async function getItemById(userId: string, id: string): Promise<Item | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // not found
      throw new Error(`getItemById failed: ${error.message}`)
    }
    return data as Item
  } catch (err) {
    console.error('[db] getItemById error:', err)
    throw err
  }
}

/**
 * Create a new item for a user.
 * Automatically creates a history entry for the creation.
 */
export async function createItem(userId: string, data: Partial<Item>): Promise<Item> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from('items')
      .insert({
        user_id:     userId,
        title:       data.title       ?? 'Untitled',
        description: data.description ?? null,
        status:      data.status      ?? 'not_started',
        priority:    data.priority    ?? 'medium',
        color:       data.color       ?? null,
        assignee:    data.assignee    ?? null,
        due_date:    data.due_date    ?? null,
        position:    data.position    ?? 0,
      })
      .select()
      .single()

    if (error) throw new Error(`createItem failed: ${error.message}`)

    const item = row as Item
    await createHistoryEntry(item.id, 'created', null, item.title)
    return item
  } catch (err) {
    console.error('[db] createItem error:', err)
    throw err
  }
}

/**
 * Update fields on an item scoped to the user.
 * Creates a history entry for each changed field.
 */
export async function updateItem(
  userId: string,
  id: string,
  data: Partial<Item>
): Promise<Item> {
  try {
    // Fetch current values for diffing
    const current = await getItemById(userId, id)
    if (!current) throw new Error(`updateItem: item ${id} not found for user`)

    const allowedFields: (keyof Partial<Item>)[] = [
      'title', 'description', 'status', 'priority',
      'color', 'assignee', 'due_date', 'position',
    ]

    const patch: Record<string, unknown> = {
      last_modified: new Date().toISOString(),
    }
    for (const field of allowedFields) {
      if (data[field] !== undefined) patch[field] = data[field]
    }

    const { data: row, error } = await supabaseAdmin
      .from('items')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`updateItem failed: ${error.message}`)

    const updated = row as Item

    // Write a history entry for each field that actually changed
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const oldVal = current[field] != null ? String(current[field]) : null
        const newVal = data[field]    != null ? String(data[field])    : null
        if (oldVal !== newVal) {
          await createHistoryEntry(id, field, oldVal, newVal)
        }
      }
    }

    return updated
  } catch (err) {
    console.error('[db] updateItem error:', err)
    throw err
  }
}

/**
 * Delete an item scoped to the user.
 * Returns true if deleted, false if not found.
 */
export async function deleteItem(userId: string, id: string): Promise<boolean> {
  try {
    const { error, count } = await supabaseAdmin
      .from('items')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`deleteItem failed: ${error.message}`)
    return (count ?? 0) > 0
  } catch (err) {
    console.error('[db] deleteItem error:', err)
    throw err
  }
}

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * Append a structured history entry for a field change.
 */
export async function createHistoryEntry(
  itemId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('item_history')
      .insert({
        item_id:   itemId,
        field,
        old_value: oldValue != null ? String(oldValue) : null,
        new_value: newValue != null ? String(newValue) : null,
      })

    if (error) throw new Error(`createHistoryEntry failed: ${error.message}`)
  } catch (err) {
    console.error('[db] createHistoryEntry error:', err)
    throw err
  }
}

/**
 * Fetch history for an item, newest first.
 * The userId check ensures the item belongs to the user.
 * Optionally filter by timeframe: 'last_week' | 'last_30_days'.
 */
export async function getItemHistory(
  userId: string,
  itemId: string,
  timeframe?: 'last_week' | 'last_30_days'
): Promise<ItemHistory[]> {
  try {
    // Verify item belongs to user
    const item = await getItemById(userId, itemId)
    if (!item) throw new Error(`getItemHistory: item ${itemId} not found for user`)

    let query = supabaseAdmin
      .from('item_history')
      .select('*')
      .eq('item_id', itemId)
      .order('changed_at', { ascending: false })

    if (timeframe) {
      const since = new Date()
      if (timeframe === 'last_week')    since.setDate(since.getDate() - 7)
      if (timeframe === 'last_30_days') since.setDate(since.getDate() - 30)
      query = query.gte('changed_at', since.toISOString())
    }

    const { data, error } = await query
    if (error) throw new Error(`getItemHistory failed: ${error.message}`)
    return (data ?? []) as ItemHistory[]
  } catch (err) {
    console.error('[db] getItemHistory error:', err)
    throw err
  }
}
