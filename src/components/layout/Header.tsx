import { Plus, Menu, Sun, Moon } from 'lucide-react'
import type { Project, AppView } from '../../types'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { COLUMN_IDS, COLUMN_META } from '../../constants'
import { getColumnTasks } from '../../utils/taskUtils'

interface HeaderProps {
  view: AppView
  project: Project | null
  onAddTask: () => void
  onMenuClick: () => void
}

export function Header({ view, project, onAddTask, onMenuClick }: HeaderProps) {
  const { tasks, projects } = useApp()
  const { theme, toggleTheme } = useTheme()

  const isAnalytics = view === 'analytics'

  const taskCounts = !isAnalytics && project
    ? COLUMN_IDS.map(col => ({
        ...COLUMN_META[col],
        count: getColumnTasks(tasks, project.id, col).length,
      }))
    : []

  const title = isAnalytics ? 'Workload Analytics' : project ? project.name : 'No project selected'

  return (
    <header
      className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
      style={
        isAnalytics
          ? { borderTop: '2px solid #6366f1' }
          : project
          ? { borderTop: `2px solid ${project.color}` }
          : {}
      }
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {isAnalytics ? (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              Across <span className="text-gray-700 dark:text-gray-300 font-medium">{projects.length}</span>{' '}
              {projects.length === 1 ? 'project' : 'projects'} ·{' '}
              <span className="text-gray-700 dark:text-gray-300 font-medium">{tasks.length}</span>{' '}
              {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          ) : (
            project && (
              <div className="flex items-center gap-3 mt-0.5">
                {taskCounts.map(col => (
                  <span key={col.label} className="text-xs text-gray-500 dark:text-gray-500">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{col.count}</span> {col.label}
                  </span>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {!isAnalytics && project && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </header>
  )
}
