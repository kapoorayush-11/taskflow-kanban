import type { ColumnId, Priority, WorkloadStatus, RiskLevel } from '../types'

export const STORAGE_KEY = 'kanban_app_v1'

export const COLUMN_IDS: ColumnId[] = ['todo', 'in-progress', 'done']

export const COLUMN_META: Record<ColumnId, { label: string; borderColor: string; badgeBg: string; badgeText: string }> = {
  'todo': {
    label: 'To Do',
    borderColor: 'border-slate-400 dark:border-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-700',
    badgeText: 'text-slate-600 dark:text-slate-300',
  },
  'in-progress': {
    label: 'In Progress',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  'done': {
    label: 'Done',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
}

export const PRIORITY_META: Record<Priority, { label: string; bg: string; text: string; dot: string }> = {
  low: {
    label: 'Low',
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-50 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-red-50 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
  },
}

export const PROJECT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
]

// ── Workload analytics ───────────────────────────────────────────────────────

// Relative "cost" of an unfinished task by priority. A member's load is the sum
// of these weights across their active (non-done) tasks.
export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 5,
}

// Weighted-load cutoffs used to classify capacity. <= available → has capacity;
// <= balanced → balanced; above balanced → overloaded.
export const CAPACITY_THRESHOLDS = { available: 6, balanced: 12 }

// Fallback "typical" durations (in days) per priority, used to project risk when
// there is not yet enough completed-task history to learn from.
export const DEFAULT_DURATIONS: Record<Priority, number> = {
  urgent: 2,
  high: 4,
  medium: 6,
  low: 9,
}

export const WORKLOAD_STATUS_META: Record<WorkloadStatus, { label: string; badgeBg: string; badgeText: string; bar: string }> = {
  available: {
    label: 'Has capacity',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-500 dark:bg-emerald-400',
  },
  balanced: {
    label: 'Balanced',
    badgeBg: 'bg-blue-50 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    bar: 'bg-blue-500 dark:bg-blue-400',
  },
  overloaded: {
    label: 'Overloaded',
    badgeBg: 'bg-red-50 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-400',
    bar: 'bg-red-500 dark:bg-red-400',
  },
}

export const RISK_META: Record<RiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  'on-track': {
    label: 'On track',
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  tight: {
    label: 'Tight',
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  'at-risk': {
    label: 'At risk',
    bg: 'bg-orange-50 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-50 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
  },
}
