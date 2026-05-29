import { createClient } from '@supabase/supabase-js'
import type { Project, Task, Priority, ColumnId } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client, or `null` when env vars are absent. When null the app falls
 * back to localStorage, so it still runs (single-player) without a backend.
 * The anon key is a public client key — access is governed by Row Level
 * Security policies in the database, never by hiding this key.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isSupabaseEnabled = supabase !== null

// ── Row shapes (snake_case in Postgres) ↔ app types (camelCase) ──────────────

export interface ProjectRow {
  id: string
  name: string
  color: string
  created_at: string
}

export interface TaskRow {
  id: string
  project_id: string
  column_id: string
  title: string
  description: string
  assignee: string
  due_date: string | null
  priority: string
  sort_order: number
  created_at: string
  updated_at: string
}

export function toProjectRow(p: Project): ProjectRow {
  return { id: p.id, name: p.name, color: p.color, created_at: p.createdAt }
}

export function fromProjectRow(r: ProjectRow): Project {
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at }
}

export function toTaskRow(t: Task): TaskRow {
  return {
    id: t.id,
    project_id: t.projectId,
    column_id: t.columnId,
    title: t.title,
    description: t.description,
    assignee: t.assignee,
    due_date: t.dueDate,
    priority: t.priority,
    sort_order: t.order,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

export function fromTaskRow(r: TaskRow): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    columnId: r.column_id as ColumnId,
    title: r.title,
    description: r.description,
    assignee: r.assignee,
    dueDate: r.due_date,
    priority: r.priority as Priority,
    order: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
