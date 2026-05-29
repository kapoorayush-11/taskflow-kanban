export type ColumnId = 'todo' | 'in-progress' | 'done'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  columnId: ColumnId
  title: string
  description: string
  assignee: string
  dueDate: string | null
  priority: Priority
  order: number
  createdAt: string
  updatedAt: string
}

export interface AppData {
  projects: Project[]
  tasks: Task[]
}

export interface CreateTaskInput {
  title: string
  description: string
  assignee: string
  dueDate: string | null
  priority: Priority
  columnId: ColumnId
}

export interface AppContextValue {
  projects: Project[]
  tasks: Task[]
  activeProjectId: string | null
  setActiveProjectId: (id: string) => void
  createProject: (name: string, color: string) => void
  deleteProject: (id: string) => void
  createTask: (data: CreateTaskInput) => void
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  reorderTasks: (columnId: ColumnId, orderedIds: string[]) => void
  moveTask: (taskId: string, toColumnId: ColumnId, overId: string | null) => void
}

// Top-level view switching (board per-project vs. cross-project analytics).
export type AppView = 'board' | 'analytics'

// Capacity classification for a team member's active workload.
export type WorkloadStatus = 'available' | 'balanced' | 'overloaded'

// How a task's projected completion compares against its due date.
export type RiskLevel = 'on-track' | 'tight' | 'at-risk' | 'overdue'

// How much historical data backs a risk estimate.
export type RiskConfidence = 'high' | 'medium' | 'low' | 'none'
