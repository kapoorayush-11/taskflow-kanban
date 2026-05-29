import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Task, ColumnId } from '../../types'
import { COLUMN_META } from '../../constants'
import { TaskCard } from './TaskCard'
import { EmptyColumn } from './EmptyColumn'

interface KanbanColumnProps {
  columnId: ColumnId
  tasks: Task[]
  onAddTask: (columnId: ColumnId) => void
  onEditTask: (task: Task) => void
}

export function KanbanColumn({ columnId, tasks, onAddTask, onEditTask }: KanbanColumnProps) {
  const meta = COLUMN_META[columnId]
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div className="flex flex-col min-w-[280px] w-full max-w-xs flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2.5 mb-2 rounded-t-lg border-t-2 bg-white dark:bg-gray-900 ${meta.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{meta.label}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${meta.badgeBg} ${meta.badgeText}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(columnId)}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 min-h-[120px] rounded-b-lg p-1 transition-colors ${
          isOver ? 'bg-indigo-50/60 dark:bg-indigo-900/20 ring-1 ring-indigo-300/50 dark:ring-indigo-500/30' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyColumn />
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={onEditTask} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
