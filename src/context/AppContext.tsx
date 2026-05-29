import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Task, ColumnId, AppContextValue, CreateTaskInput } from '../types'
import { loadData, saveData } from '../utils/storage'
import { getMaxOrder, getColumnTasks } from '../utils/taskUtils'
import {
  supabase,
  toProjectRow,
  fromProjectRow,
  toTaskRow,
  fromTaskRow,
  type ProjectRow,
  type TaskRow,
} from '../lib/supabase'

interface AppState {
  projects: Project[]
  tasks: Task[]
  activeProjectId: string | null
}

type Action =
  | { type: 'HYDRATE'; projects: Project[]; tasks: Task[] }
  | { type: 'SET_ACTIVE_PROJECT'; id: string | null }
  | { type: 'UPSERT_PROJECT'; project: Project }
  | { type: 'REMOVE_PROJECT'; id: string }
  | { type: 'UPSERT_TASKS'; tasks: Task[] }
  | { type: 'REMOVE_TASK'; id: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        projects: action.projects,
        tasks: action.tasks,
        activeProjectId: action.projects[0]?.id ?? null,
      }

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.id }

    case 'UPSERT_PROJECT': {
      const exists = state.projects.some(p => p.id === action.project.id)
      const projects = exists
        ? state.projects.map(p => (p.id === action.project.id ? action.project : p))
        : [...state.projects, action.project]
      // Auto-select the first project that appears (helps a second viewer whose
      // board would otherwise be empty until they pick one).
      return { ...state, projects, activeProjectId: state.activeProjectId ?? action.project.id }
    }

    case 'REMOVE_PROJECT': {
      const projects = state.projects.filter(p => p.id !== action.id)
      const tasks = state.tasks.filter(t => t.projectId !== action.id)
      const activeProjectId =
        state.activeProjectId === action.id ? (projects[0]?.id ?? null) : state.activeProjectId
      return { projects, tasks, activeProjectId }
    }

    case 'UPSERT_TASKS': {
      // Map keyed by id → idempotent. Handles our optimistic writes and the
      // realtime echo of those same rows without creating duplicates.
      const map = new Map(state.tasks.map(t => [t.id, t]))
      for (const t of action.tasks) map.set(t.id, t)
      return { ...state, tasks: [...map.values()] }
    }

    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) }

    default:
      return state
  }
}

const nowIso = () => new Date().toISOString()

/** Log (never throw) a Supabase write result so a failed sync can't break the UI. */
function logWrite(label: string) {
  return (res: { error: unknown }) => {
    if (res.error) console.error(`[supabase] ${label}`, res.error)
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

  // Always-current snapshot so the (stable) mutation callbacks can read latest
  // state without being re-created on every change.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Initial hydrate + (cloud mode) realtime subscription.
  useEffect(() => {
    let cancelled = false

    if (supabase) {
      const client = supabase
      ;(async () => {
        const [projectsRes, tasksRes] = await Promise.all([
          client.from('projects').select('*').order('created_at', { ascending: true }),
          client.from('tasks').select('*'),
        ])
        if (cancelled) return
        if (projectsRes.error) console.error('[supabase] load projects', projectsRes.error)
        if (tasksRes.error) console.error('[supabase] load tasks', tasksRes.error)
        const projects = ((projectsRes.data as ProjectRow[] | null) ?? []).map(fromProjectRow)
        const tasks = ((tasksRes.data as TaskRow[] | null) ?? []).map(fromTaskRow)
        dispatch({ type: 'HYDRATE', projects, tasks })
        setLoaded(true)
      })()

      const channel = client
        .channel('kanban-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
          if (payload.eventType === 'DELETE') {
            dispatch({ type: 'REMOVE_PROJECT', id: (payload.old as { id: string }).id })
          } else {
            dispatch({ type: 'UPSERT_PROJECT', project: fromProjectRow(payload.new as ProjectRow) })
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
          if (payload.eventType === 'DELETE') {
            dispatch({ type: 'REMOVE_TASK', id: (payload.old as { id: string }).id })
          } else {
            dispatch({ type: 'UPSERT_TASKS', tasks: [fromTaskRow(payload.new as TaskRow)] })
          }
        })
        .subscribe()

      return () => {
        cancelled = true
        client.removeChannel(channel)
      }
    }

    // Fallback: local-only mode.
    const data = loadData()
    dispatch({ type: 'HYDRATE', projects: data.projects, tasks: data.tasks })
    setLoaded(true)
    return () => {
      cancelled = true
    }
  }, [])

  // Persist to localStorage only in fallback mode (cloud mode is the source of truth).
  useEffect(() => {
    if (!loaded || supabase) return
    saveData({ projects: state.projects, tasks: state.tasks })
  }, [loaded, state.projects, state.tasks])

  const setActiveProjectId = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', id })
  }, [])

  const createProject = useCallback((name: string, color: string) => {
    const project: Project = { id: uuidv4(), name, color, createdAt: nowIso() }
    dispatch({ type: 'UPSERT_PROJECT', project })
    dispatch({ type: 'SET_ACTIVE_PROJECT', id: project.id })
    supabase?.from('projects').insert(toProjectRow(project)).then(logWrite('createProject'))
  }, [])

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PROJECT', id })
    // Tasks are removed via ON DELETE CASCADE in the DB (and locally above).
    supabase?.from('projects').delete().eq('id', id).then(logWrite('deleteProject'))
  }, [])

  const createTask = useCallback((data: CreateTaskInput) => {
    const { activeProjectId, tasks } = stateRef.current
    if (!activeProjectId) return
    const now = nowIso()
    const task: Task = {
      id: uuidv4(),
      projectId: activeProjectId,
      order: getMaxOrder(tasks, activeProjectId, data.columnId) + 1,
      createdAt: now,
      updatedAt: now,
      ...data,
    }
    dispatch({ type: 'UPSERT_TASKS', tasks: [task] })
    supabase?.from('tasks').insert(toTaskRow(task)).then(logWrite('createTask'))
  }, [])

  const updateTask = useCallback(
    (id: string, changes: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => {
      const existing = stateRef.current.tasks.find(t => t.id === id)
      if (!existing) return
      const updated: Task = { ...existing, ...changes, updatedAt: nowIso() }
      dispatch({ type: 'UPSERT_TASKS', tasks: [updated] })
      supabase?.from('tasks').update(toTaskRow(updated)).eq('id', id).then(logWrite('updateTask'))
    },
    []
  )

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TASK', id })
    supabase?.from('tasks').delete().eq('id', id).then(logWrite('deleteTask'))
  }, [])

  const reorderTasks = useCallback((columnId: ColumnId, orderedIds: string[]) => {
    const byId = new Map(stateRef.current.tasks.map(t => [t.id, t]))
    const now = nowIso()
    const affected: Task[] = []
    orderedIds.forEach((id, idx) => {
      const t = byId.get(id)
      if (t && t.columnId === columnId) affected.push({ ...t, order: idx, updatedAt: now })
    })
    if (affected.length === 0) return
    dispatch({ type: 'UPSERT_TASKS', tasks: affected })
    supabase?.from('tasks').upsert(affected.map(toTaskRow)).then(logWrite('reorderTasks'))
  }, [])

  const moveTask = useCallback((taskId: string, toColumnId: ColumnId, overId: string | null) => {
    const { tasks } = stateRef.current
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const now = nowIso()

    const targetTasks = getColumnTasks(tasks.filter(t => t.id !== taskId), task.projectId, toColumnId)
    let insertAt: number
    if (overId === null || overId === toColumnId) {
      insertAt = targetTasks.length
    } else {
      const overIdx = targetTasks.findIndex(t => t.id === overId)
      insertAt = overIdx === -1 ? targetTasks.length : overIdx
    }

    const ordered = [...targetTasks]
    ordered.splice(insertAt, 0, task)
    // Reindex the destination column; the moved task also adopts the new column.
    const affected: Task[] = ordered.map((t, idx) => ({
      ...t,
      columnId: toColumnId,
      order: idx,
      updatedAt: now,
    }))

    dispatch({ type: 'UPSERT_TASKS', tasks: affected })
    supabase?.from('tasks').upsert(affected.map(toTaskRow)).then(logWrite('moveTask'))
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
