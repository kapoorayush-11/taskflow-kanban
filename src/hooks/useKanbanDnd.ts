import { useState, useCallback } from 'react'
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import type { Task, ColumnId } from '../types'
import { COLUMN_IDS } from '../constants'
import { useApp } from '../context/AppContext'
import { getColumnTasks } from '../utils/taskUtils'

export function useKanbanDnd(projectId: string | null) {
  const { tasks, moveTask, reorderTasks } = useApp()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const isColumnId = (id: string): id is ColumnId =>
    COLUMN_IDS.includes(id as ColumnId)

  const getTaskColumnId = useCallback(
    (id: string): ColumnId | null => {
      if (isColumnId(id)) return id
      return tasks.find(t => t.id === id)?.columnId ?? null
    },
    [tasks]
  )

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find(t => t.id === event.active.id)
      if (task) setActiveTask(task)
    },
    [tasks]
  )

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over || !projectId) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeTask = tasks.find(t => t.id === activeId)
      if (!activeTask) return

      const overColumnId = getTaskColumnId(overId)
      if (!overColumnId) return

      if (activeTask.columnId !== overColumnId) {
        moveTask(activeId, overColumnId, isColumnId(overId) ? null : overId)
      }
    },
    [tasks, projectId, getTaskColumnId, moveTask]
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over || !projectId) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeTask = tasks.find(t => t.id === activeId)
      if (!activeTask) return

      const overColumnId = getTaskColumnId(overId)
      if (!overColumnId || activeTask.columnId !== overColumnId) return

      const colTasks = getColumnTasks(tasks, projectId, overColumnId)
      const oldIndex = colTasks.findIndex(t => t.id === activeId)
      const newIndex = isColumnId(overId)
        ? colTasks.length - 1
        : colTasks.findIndex(t => t.id === overId)

      if (oldIndex !== newIndex && newIndex !== -1) {
        const reordered = arrayMove(colTasks, oldIndex, newIndex)
        reorderTasks(overColumnId, reordered.map(t => t.id))
      }
    },
    [tasks, projectId, getTaskColumnId, reorderTasks]
  )

  const onDragCancel = useCallback(() => {
    setActiveTask(null)
  }, [])

  return { sensors, activeTask, onDragStart, onDragOver, onDragEnd, onDragCancel }
}
