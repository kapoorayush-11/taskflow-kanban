import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import type { Task, ColumnId } from '../../types'
import { COLUMN_IDS } from '../../constants'
import { useApp } from '../../context/AppContext'
import { useKanbanDnd } from '../../hooks/useKanbanDnd'
import { getColumnTasks } from '../../utils/taskUtils'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardOverlay } from './TaskCard'

interface KanbanBoardProps {
  projectId: string
  onAddTask: (columnId: ColumnId) => void
  onEditTask: (task: Task) => void
}

export function KanbanBoard({ projectId, onAddTask, onEditTask }: KanbanBoardProps) {
  const { tasks } = useApp()
  const { sensors, activeTask, onDragStart, onDragOver, onDragEnd, onDragCancel } = useKanbanDnd(projectId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4 px-4 lg:px-6">
        {COLUMN_IDS.map(columnId => (
          <KanbanColumn
            key={columnId}
            columnId={columnId}
            tasks={getColumnTasks(tasks, projectId, columnId)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
