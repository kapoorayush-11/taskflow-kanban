import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Project } from '../../types'

interface SidebarProjectItemProps {
  project: Project
  taskCount: number
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function SidebarProjectItem({ project, taskCount, isActive, onClick, onDelete }: SidebarProjectItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); setShowDeleteConfirm(true) }
  const handleConfirmDelete = (e: React.MouseEvent) => { e.stopPropagation(); onDelete() }
  const handleCancelDelete = (e: React.MouseEvent) => { e.stopPropagation(); setShowDeleteConfirm(false) }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
          isActive
            ? 'bg-indigo-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        style={isActive ? { borderLeft: `2px solid ${project.color}`, paddingLeft: '10px' } : {}}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        <span className="text-sm font-medium truncate flex-1">{project.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{taskCount}</span>
      </button>

      {!showDeleteConfirm && (
        <button
          onClick={handleDeleteClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
          aria-label="Delete project"
        >
          <Trash2 size={12} />
        </button>
      )}

      {showDeleteConfirm && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-1 py-0.5 shadow-lg border border-gray-200 dark:border-gray-700 z-10"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Delete?</span>
          <button onClick={handleConfirmDelete} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 px-1.5 py-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">Yes</button>
          <button onClick={handleCancelDelete} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">No</button>
        </div>
      )}
    </div>
  )
}
