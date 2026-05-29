import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Task, Priority, Project, WorkloadStatus, RiskLevel, RiskConfidence } from '../types'
import {
  PRIORITY_WEIGHTS,
  CAPACITY_THRESHOLDS,
  DEFAULT_DURATIONS,
  PROJECT_COLORS,
} from '../constants'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const UNASSIGNED_KEY = '__unassigned__'
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

/** The learned (or fallback) "typical" time tasks of a given priority take. */
export interface TypicalDuration {
  days: number
  basis: 'priority' | 'overall' | 'default'
  sampleSize: number
  confidence: RiskConfidence
}

/** A single task's projected standing against its due date. */
export interface TaskRisk {
  task: Task
  project: Project | null
  level: RiskLevel
  /** Calendar days from today to the due date (negative = already past). */
  daysUntilDue: number
  /** Estimated working days still needed to finish. */
  estRemainingDays: number
  /** How many days late completion is projected to be (0 when not late). */
  projectedOverDays: number
  typical: TypicalDuration
}

/** Aggregated load for one assignee (or the synthetic "Unassigned" bucket). */
export interface MemberWorkload {
  key: string
  name: string
  isUnassigned: boolean
  total: number
  todo: number
  inProgress: number
  done: number
  active: number
  /** Priority-weighted sum across active tasks. */
  load: number
  status: WorkloadStatus
  overdueCount: number
  atRiskCount: number
}

export interface WorkloadSummary {
  totalTasks: number
  totalActive: number
  memberCount: number
  overloadedCount: number
  availableCount: number
  atRiskCount: number
  overdueCount: number
  unassignedActive: number
  /** Number of completed tasks available as historical signal. */
  completedSampleSize: number
}

export interface WorkloadAnalytics {
  summary: WorkloadSummary
  members: MemberWorkload[]
  risks: TaskRisk[]
  typicalByPriority: Record<Priority, TypicalDuration>
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function isActive(task: Task): boolean {
  return task.columnId !== 'done'
}

/**
 * Completion proxy for a finished task: days between creation and the last
 * update (which is set when the card is moved to "Done"). It's a heuristic —
 * later edits to a done card can inflate it — but it's the best signal the
 * data model carries without a dedicated completedAt field.
 */
function completionDays(task: Task): number {
  const created = new Date(task.createdAt).getTime()
  const updated = new Date(task.updatedAt).getTime()
  const days = (updated - created) / MS_PER_DAY
  return days > 0 ? days : 0
}

function confidenceFor(basis: TypicalDuration['basis'], sampleSize: number): RiskConfidence {
  if (basis === 'priority') return sampleSize >= 5 ? 'high' : 'medium'
  if (basis === 'overall') return 'low'
  return 'none'
}

/**
 * Learn the typical duration per priority from completed tasks. Falls back to
 * the overall median when a priority lacks samples, then to static defaults
 * when there's no history at all.
 */
export function computeTypicalDurations(tasks: Task[]): {
  byPriority: Record<Priority, TypicalDuration>
  completedSampleSize: number
} {
  const done = tasks.filter(t => t.columnId === 'done')
  const allDurations = done.map(completionDays)
  const overallMedian = median(allDurations)

  const byPriority = {} as Record<Priority, TypicalDuration>
  for (const priority of PRIORITIES) {
    const durations = done.filter(t => t.priority === priority).map(completionDays)
    const priorityMedian = median(durations)

    if (priorityMedian !== null && durations.length >= 2) {
      byPriority[priority] = {
        days: Math.max(priorityMedian, 0.5),
        basis: 'priority',
        sampleSize: durations.length,
        confidence: confidenceFor('priority', durations.length),
      }
    } else if (overallMedian !== null && allDurations.length >= 2) {
      byPriority[priority] = {
        days: Math.max(overallMedian, 0.5),
        basis: 'overall',
        sampleSize: allDurations.length,
        confidence: 'low',
      }
    } else {
      byPriority[priority] = {
        days: DEFAULT_DURATIONS[priority],
        basis: 'default',
        sampleSize: 0,
        confidence: 'none',
      }
    }
  }

  return { byPriority, completedSampleSize: done.length }
}

/**
 * Project a single active task against its due date. Returns null when the task
 * can't miss a date (no due date, or already done).
 */
export function assessRisk(task: Task, typical: TypicalDuration, now: Date): TaskRisk | null {
  if (!task.dueDate || task.columnId === 'done') return null

  let due: Date
  try {
    due = parseISO(task.dueDate)
  } catch {
    return null
  }

  const daysUntilDue = differenceInCalendarDays(due, now)
  const elapsedDays = Math.max(0, (now.getTime() - new Date(task.createdAt).getTime()) / MS_PER_DAY)

  // To-do work hasn't started, so the full typical duration still lies ahead.
  // In-progress work has consumed some of it already (floored so it's never 0).
  const estRemainingDays =
    task.columnId === 'in-progress' ? Math.max(typical.days - elapsedDays, 0.5) : typical.days

  let level: RiskLevel
  let projectedOverDays = 0

  if (daysUntilDue < 0) {
    level = 'overdue'
    projectedOverDays = -daysUntilDue
  } else {
    const slack = daysUntilDue - estRemainingDays
    const buffer = Math.max(1, typical.days * 0.25)
    if (slack < 0) {
      level = 'at-risk'
      projectedOverDays = -slack
    } else if (slack < buffer) {
      level = 'tight'
    } else {
      level = 'on-track'
    }
  }

  return { task, project: null, level, daysUntilDue, estRemainingDays, projectedOverDays, typical }
}

function statusForLoad(load: number): WorkloadStatus {
  if (load <= CAPACITY_THRESHOLDS.available) return 'available'
  if (load <= CAPACITY_THRESHOLDS.balanced) return 'balanced'
  return 'overloaded'
}

const LEVEL_RANK: Record<RiskLevel, number> = { overdue: 0, 'at-risk': 1, tight: 2, 'on-track': 3 }

/** Build the full cross-project analytics snapshot. Pure: pass `now` in. */
export function computeWorkloadAnalytics(tasks: Task[], projects: Project[], now: Date): WorkloadAnalytics {
  const projectById = new Map(projects.map(p => [p.id, p]))
  const { byPriority, completedSampleSize } = computeTypicalDurations(tasks)

  // Risk per active task with a due date.
  const risks: TaskRisk[] = []
  const riskByTaskId = new Map<string, TaskRisk>()
  for (const task of tasks) {
    const risk = assessRisk(task, byPriority[task.priority], now)
    if (!risk) continue
    risk.project = projectById.get(task.projectId) ?? null
    riskByTaskId.set(task.id, risk)
    if (risk.level !== 'on-track') risks.push(risk)
  }

  risks.sort((a, b) => {
    if (LEVEL_RANK[a.level] !== LEVEL_RANK[b.level]) return LEVEL_RANK[a.level] - LEVEL_RANK[b.level]
    if (b.projectedOverDays !== a.projectedOverDays) return b.projectedOverDays - a.projectedOverDays
    return a.daysUntilDue - b.daysUntilDue
  })

  // Aggregate per assignee.
  const memberMap = new Map<string, MemberWorkload>()
  const ensureMember = (assignee: string): MemberWorkload => {
    const trimmed = assignee.trim()
    const isUnassigned = trimmed === ''
    const key = isUnassigned ? UNASSIGNED_KEY : trimmed.toLowerCase()
    let member = memberMap.get(key)
    if (!member) {
      member = {
        key,
        name: isUnassigned ? 'Unassigned' : trimmed,
        isUnassigned,
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        active: 0,
        load: 0,
        status: 'available',
        overdueCount: 0,
        atRiskCount: 0,
      }
      memberMap.set(key, member)
    }
    return member
  }

  for (const task of tasks) {
    const member = ensureMember(task.assignee)
    member.total++
    if (task.columnId === 'todo') member.todo++
    else if (task.columnId === 'in-progress') member.inProgress++
    else member.done++

    if (isActive(task)) {
      member.active++
      member.load += PRIORITY_WEIGHTS[task.priority]
      const risk = riskByTaskId.get(task.id)
      if (risk && risk.level !== 'on-track') {
        if (risk.level === 'overdue') member.overdueCount++
        member.atRiskCount++
      }
    }
  }

  const members = [...memberMap.values()]
  for (const member of members) {
    // Unassigned isn't a person, so it isn't classified as over/under capacity.
    member.status = member.isUnassigned ? 'available' : statusForLoad(member.load)
  }
  members.sort((a, b) => {
    if (a.isUnassigned !== b.isUnassigned) return a.isUnassigned ? 1 : -1
    if (b.load !== a.load) return b.load - a.load
    return b.active - a.active
  })

  const realMembers = members.filter(m => !m.isUnassigned)
  const unassigned = members.find(m => m.isUnassigned)

  const summary: WorkloadSummary = {
    totalTasks: tasks.length,
    totalActive: tasks.filter(isActive).length,
    memberCount: realMembers.length,
    overloadedCount: realMembers.filter(m => m.status === 'overloaded').length,
    availableCount: realMembers.filter(m => m.status === 'available').length,
    atRiskCount: risks.length,
    overdueCount: risks.filter(r => r.level === 'overdue').length,
    unassignedActive: unassigned ? unassigned.active : 0,
    completedSampleSize,
  }

  return { summary, members, risks, typicalByPriority: byPriority }
}

/** Up-to-two-letter initials for an avatar. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic avatar color from the palette, keyed on the member name. */
export function getMemberColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[hash % PROJECT_COLORS.length]
}
