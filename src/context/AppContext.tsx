import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Task, ColumnId, AppContextValue, CreateTaskInput } from '../types'
import { loadData, saveData } from '../utils/storage'
import { getMaxOrder, getColumnTasks } from '../utils/taskUtils'

interface AppState {
  projects: Project[]
  tasks: Task[]
  activeProjectId: string | null
}

type Action =
  | { type: 'INIT'; payload: { projects: Project[]; tasks: Task[] } }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string }
  | { type: 'CREATE_PROJECT'; payload: { name: string; color: string } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'CREATE_TASK'; payload: CreateTaskInput & { projectId: string } }
  | { type: 'UPDATE_TASK'; payload: { id: string; changes: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: { columnId: ColumnId; orderedIds: string[] } }
  | { type: 'MOVE_TASK'; payload: { taskId: string; toColumnId: ColumnId; overId: string | null } }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        projects: action.payload.projects,
        tasks: action.payload.tasks,
        activeProjectId: action.payload.projects[0]?.id ?? null,
      }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload }

    case 'CREATE_PROJECT': {
      const project: Project = {
        id: uuidv4(),
        name: action.payload.name,
        color: action.payload.color,
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        projects: [...state.projects, project],
        activeProjectId: project.id,
      }
    }

    case 'DELETE_PROJECT': {
      const id = action.payload
      const projects = state.projects.filter(p => p.id !== id)
      const tasks = state.tasks.filter(t => t.projectId !== id)
      const activeProjectId =
        state.activeProjectId === id ? (projects[0]?.id ?? null) : state.activeProjectId
      return { projects, tasks, activeProjectId }
    }

    case 'CREATE_TASK': {
      const { projectId, columnId, ...rest } = action.payload
      const maxOrder = getMaxOrder(state.tasks, projectId, columnId)
      const task: Task = {
        id: uuidv4(),
        projectId,
        columnId,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...rest,
      }
      return { ...state, tasks: [...state.tasks, task] }
    }

    case 'UPDATE_TASK': {
      const { id, changes } = action.payload
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
        ),
      }
    }

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }

    case 'REORDER_TASKS': {
      const { columnId, orderedIds } = action.payload
      const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]))
      return {
        ...state,
        tasks: state.tasks.map(t =>
          orderMap.has(t.id) && t.columnId === columnId
            ? { ...t, order: orderMap.get(t.id)!, updatedAt: new Date().toISOString() }
            : t
        ),
      }
    }

    case 'MOVE_TASK': {
      const { taskId, toColumnId, overId } = action.payload
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) return state

      // Get current tasks in target column (excluding the moving task)
      const targetTasks = getColumnTasks(
        state.tasks.filter(t => t.id !== taskId),
        task.projectId,
        toColumnId
      )

      let insertAt: number
      if (overId === null || overId === toColumnId) {
        // Drop onto column itself or no over item → append at end
        insertAt = targetTasks.length
      } else {
        const overIdx = targetTasks.findIndex(t => t.id === overId)
        insertAt = overIdx === -1 ? targetTasks.length : overIdx
      }

      // Rebuild order for target column
      const newTargetOrder = [...targetTasks]
      newTargetOrder.splice(insertAt, 0, { ...task, columnId: toColumnId })

      const orderMap = new Map(newTargetOrder.map((t, idx) => [t.id, idx]))
      orderMap.set(taskId, insertAt)

      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, columnId: toColumnId, order: insertAt, updatedAt: new Date().toISOString() }
          }
          if (orderMap.has(t.id) && t.columnId === toColumnId) {
            return { ...t, order: orderMap.get(t.id)!, updatedAt: new Date().toISOString() }
          }
          return t
        }),
      }
    }

    default:
      return state
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    tasks: [],
    activeProjectId: null,
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const data = loadData()
    dispatch({ type: 'INIT', payload: data })
    setLoaded(true)
  }, [])

  // Only persist after the initial load — prevents overwriting localStorage with empty state on mount
  useEffect(() => {
    if (!loaded) return
    saveData({ projects: state.projects, tasks: state.tasks })
  }, [loaded, state.projects, state.tasks])

  const setActiveProjectId = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: id })
  }, [])

  const createProject = useCallback((name: string, color: string) => {
    dispatch({ type: 'CREATE_PROJECT', payload: { name, color } })
  }, [])

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id })
  }, [])

  const createTask = useCallback((data: CreateTaskInput) => {
    if (!state.activeProjectId) return
    dispatch({ type: 'CREATE_TASK', payload: { ...data, projectId: state.activeProjectId } })
  }, [state.activeProjectId])

  const updateTask = useCallback((id: string, changes: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, changes } })
  }, [])

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id })
  }, [])

  const reorderTasks = useCallback((columnId: ColumnId, orderedIds: string[]) => {
    dispatch({ type: 'REORDER_TASKS', payload: { columnId, orderedIds } })
  }, [])

  const moveTask = useCallback((taskId: string, toColumnId: ColumnId, overId: string | null) => {
    dispatch({ type: 'MOVE_TASK', payload: { taskId, toColumnId, overId } })
  }, [])

  const value: AppContextValue = {
    projects: state.projects,
    tasks: state.tasks,
    activeProjectId: state.activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    moveTask,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
