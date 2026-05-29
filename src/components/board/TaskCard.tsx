import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { User, Calendar, AlignLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Task } from '../../types'
import { PriorityBadge } from '../ui/PriorityBadge'
import { isOverdue } from '../../utils/taskUtils'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const overdue = isOverdue(task.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm select-none ${
        isDragging ? 'opacity-40 shadow-none' : 'shadow-sm'
      }`}
      onClick={() => onEdit(task)}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mb-2 flex items-center gap-1">
          <AlignLeft size={10} className="shrink-0" />
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-2">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <Calendar size={11} />
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <User size={11} />
              <span className="max-w-[64px] truncate">{task.assignee}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function TaskCardOverlay({ task }: { task: Task }) {
  const overdue = isOverdue(task.dueDate)
  return (
    <div className="bg-white dark:bg-gray-800 border border-indigo-400 rounded-lg p-3 shadow-xl rotate-1 opacity-95 w-full">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <Calendar size={11} />
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <User size={11} />
              <span className="max-w-[64px] truncate">{task.assignee}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
