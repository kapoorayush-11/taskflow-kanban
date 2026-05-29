import React, { useState } from 'react'
import { Modal } from './Modal'
import { TextInput, Textarea } from '../ui/TextInput'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useApp } from '../../context/AppContext'
import type { Task, Priority, ColumnId } from '../../types'
import { COLUMN_IDS, COLUMN_META } from '../../constants'

interface TaskModalProps {
  task?: Task
  defaultColumnId?: ColumnId
  onClose: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const COLUMN_OPTIONS = COLUMN_IDS.map(id => ({ value: id, label: COLUMN_META[id].label }))

export function TaskModal({ task, defaultColumnId = 'todo', onClose }: TaskModalProps) {
  const { createTask, updateTask, deleteTask } = useApp()
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assignee, setAssignee] = useState(task?.assignee ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [columnId, setColumnId] = useState<ColumnId>(task?.columnId ?? defaultColumnId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [titleError, setTitleError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }
    const data = {
      title: title.trim(),
      description,
      assignee,
      dueDate: dueDate || null,
      priority,
      columnId,
    }
    if (isEdit && task) {
      updateTask(task.id, data)
    } else {
      createTask(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (!task) return
    deleteTask(task.id)
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          id="task-title"
          label="Title"
          placeholder="e.g. Design the landing page"
          value={title}
          onChange={e => { setTitle(e.target.value); if (titleError) setTitleError('') }}
          maxLength={120}
          required
          error={titleError}
        />
        <Textarea
          id="task-description"
          label="Description"
          placeholder="Add more details..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            id="task-assignee"
            label="Assignee"
            placeholder="e.g. Alice"
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="task-due-date" className="text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="task-priority"
            label="Priority"
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
            options={PRIORITY_OPTIONS}
          />
          {!isEdit && (
            <Select
              id="task-column"
              label="Column"
              value={columnId}
              onChange={e => setColumnId(e.target.value as ColumnId)}
              options={COLUMN_OPTIONS}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Delete this task?</span>
                <Button type="button" variant="danger" size="sm" onClick={handleDelete}>Yes, delete</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            ) : (
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
