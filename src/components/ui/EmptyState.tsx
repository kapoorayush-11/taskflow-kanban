import { LayoutDashboard } from 'lucide-react'

export function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <LayoutDashboard size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No project selected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">
          Create a project to start organizing your team's work on a Kanban board.
        </p>
      </div>
      <button
        onClick={onCreateProject}
        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Create your first project
      </button>
    </div>
  )
}
