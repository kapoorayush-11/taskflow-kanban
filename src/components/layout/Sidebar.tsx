import { Plus, Kanban, BarChart3 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { SidebarProjectItem } from './SidebarProjectItem'
import type { AppView } from '../../types'

interface SidebarProps {
  view: AppView
  onNavigate: (view: AppView) => void
  onNewProject: () => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ view, onNavigate, onNewProject, isOpen, onClose }: SidebarProps) {
  const { projects, tasks, activeProjectId, setActiveProjectId, deleteProject } = useApp()

  const getTaskCount = (projectId: string) => tasks.filter(t => t.projectId === projectId).length

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId)
    onNavigate('board')
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
          w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Kanban size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">TaskFlow</span>
        </div>

        <div className="px-2 pt-3">
          <button
            onClick={() => { onNavigate('analytics'); onClose() }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
              view === 'analytics'
                ? 'bg-indigo-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BarChart3 size={16} className="shrink-0" />
            <span className="text-sm font-medium">Workload</span>
          </button>
        </div>

        <div className="px-4 pt-4 pb-1">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Projects</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
          {projects.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 px-3 py-2">No projects yet</p>
          ) : (
            projects.map(project => (
              <SidebarProjectItem
                key={project.id}
                project={project}
                taskCount={getTaskCount(project.id)}
                isActive={view === 'board' && project.id === activeProjectId}
                onClick={() => openProject(project.id)}
                onDelete={() => deleteProject(project.id)}
              />
            ))
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onNewProject}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus size={15} />
            New Project
          </button>
        </div>
      </aside>
    </>
  )
}
