import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { computeWorkloadAnalytics } from '../utils/analytics'
import type { WorkloadAnalytics } from '../utils/analytics'

/**
 * Derives the cross-project workload + risk snapshot from current app state.
 * Recomputes only when tasks or projects change; `now` is sampled per compute.
 */
export function useWorkloadAnalytics(): WorkloadAnalytics {
  const { tasks, projects } = useApp()
  return useMemo(() => computeWorkloadAnalytics(tasks, projects, new Date()), [tasks, projects])
}
