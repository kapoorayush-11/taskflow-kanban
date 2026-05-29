import { isPast, parseISO } from 'date-fns'
import type { Task, ColumnId } from '../types'

export function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order)
}

export function getColumnTasks(tasks: Task[], projectId: string, columnId: ColumnId): Task[] {
  return sortByOrder(tasks.filter(t => t.projectId === projectId && t.columnId === columnId))
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  try {
    return isPast(parseISO(dueDate))
  } catch {
    return false
  }
}

export function getMaxOrder(tasks: Task[], projectId: string, columnId: ColumnId): number {
  const col = tasks.filter(t => t.projectId === projectId && t.columnId === columnId)
  if (col.length === 0) return -1
  return Math.max(...col.map(t => t.order))
}
