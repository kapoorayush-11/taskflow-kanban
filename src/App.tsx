import { useState } from 'react'
import { useApp } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { KanbanBoard } from './components/board/KanbanBoard'
import { CreateProjectModal } from './components/modals/CreateProjectModal'
import { TaskModal } from './components/modals/TaskModal'
import { EmptyState } from './components/ui/EmptyState'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import type { Task, ColumnId, AppView } from './types'

export default function App() {
  const { projects, activeProjectId, setActiveProjectId } = useApp()
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null

  const [view, setView] = useState<AppView>('board')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [taskModalState, setTaskModalState] = useState<
    | { open: false }
    | { open: true; task?: Task; defaultColumnId?: ColumnId }
  >({ open: false })

  const openCreateTask = (columnId?: ColumnId) =>
    setTaskModalState({ open: true, defaultColumnId: columnId ?? 'todo' })

  const openEditTask = (task: Task) =>
    setTaskModalState({ open: true, task })

  const closeTaskModal = () =>
    setTaskModalState({ open: false })

  // From the analytics dashboard: focus a task on its own project board.
  const openTaskFromAnalytics = (task: Task) => {
    setActiveProjectId(task.projectId)
    setView('board')
    openEditTask(task)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={setView}
        onNewProject={() => setCreateProjectOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          view={view}
          project={activeProject}
          onAddTask={() => openCreateTask()}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {view === 'analytics' ? (
            <AnalyticsDashboard onOpenTask={openTaskFromAnalytics} />
          ) : activeProject ? (
            <div className="flex-1 overflow-hidden pt-4">
              <KanbanBoard
                projectId={activeProject.id}
                onAddTask={openCreateTask}
                onEditTask={openEditTask}
              />
            </div>
          ) : (
            <EmptyState onCreateProject={() => setCreateProjectOpen(true)} />
          )}
        </main>
      </div>

      {createProjectOpen && (
        <CreateProjectModal onClose={() => setCreateProjectOpen(false)} />
      )}

      {taskModalState.open && (
        <TaskModal
          task={taskModalState.task}
          defaultColumnId={taskModalState.defaultColumnId}
          onClose={closeTaskModal}
        />
      )}
    </div>
  )
}
