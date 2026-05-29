import React from 'react'
import {
  ListTodo,
  Users,
  Gauge,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { Task } from '../../types'
import { useWorkloadAnalytics } from '../../hooks/useWorkloadAnalytics'
import { CAPACITY_THRESHOLDS } from '../../constants'
import { StatCard } from './StatCard'
import { MemberWorkloadRow } from './MemberWorkloadRow'
import { RiskTaskRow } from './RiskTaskRow'

interface AnalyticsDashboardProps {
  /** Jump to a task: switches to its project board and opens it for editing. */
  onOpenTask: (task: Task) => void
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon: typeof BarChart3
  children: React.ReactNode
}) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <Icon size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function AnalyticsDashboard({ onOpenTask }: AnalyticsDashboardProps) {
  const { summary, members, risks } = useWorkloadAnalytics()

  if (summary.totalTasks === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BarChart3 size={32} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Nothing to analyze yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">
            Add tasks with assignees and due dates to see who's overloaded and which work is at risk of slipping.
          </p>
        </div>
      </div>
    )
  }

  const loadScale = Math.max(CAPACITY_THRESHOLDS.balanced, ...members.map(m => m.load), 1)
  const overdueExtra = summary.overdueCount > 0 ? `${summary.overdueCount} already overdue` : undefined

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={ListTodo} label="Active tasks" value={summary.totalActive} hint={`${summary.totalTasks} total`} accent="indigo" />
          <StatCard
            icon={Users}
            label="Team members"
            value={summary.memberCount}
            hint={summary.unassignedActive > 0 ? `${summary.unassignedActive} unassigned active` : 'all work assigned'}
            accent="emerald"
          />
          <StatCard
            icon={Gauge}
            label="Overloaded"
            value={summary.overloadedCount}
            hint={`${summary.availableCount} with capacity`}
            accent={summary.overloadedCount > 0 ? 'red' : 'emerald'}
          />
          <StatCard
            icon={AlertTriangle}
            label="At-risk tasks"
            value={summary.atRiskCount}
            hint={overdueExtra}
            accent={summary.atRiskCount > 0 ? 'amber' : 'emerald'}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {/* Team workload */}
          <SectionCard
            title="Team workload"
            subtitle="Active load weighted by priority, across all projects"
            icon={BarChart3}
          >
            {members.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No assigned tasks yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {members.map(member => (
                  <MemberWorkloadRow key={member.key} member={member} scale={loadScale} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Has capacity (≤ {CAPACITY_THRESHOLDS.available})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                Balanced (≤ {CAPACITY_THRESHOLDS.balanced})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
                Overloaded
              </span>
            </div>
          </SectionCard>

          {/* Due-date risk */}
          <SectionCard
            title="Due-date risk"
            subtitle="Projected from how long similar tasks have taken"
            icon={CalendarClock}
          >
            {risks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-2">
                <CheckCircle2 size={28} className="text-emerald-500 dark:text-emerald-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All tracked tasks are on schedule</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                  Every active task with a due date is projected to finish in time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {risks.map(risk => (
                  <RiskTaskRow key={risk.task.id} risk={risk} onOpen={() => onOpenTask(risk.task)} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Methodology */}
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          <Info size={13} className="shrink-0 mt-px" />
          <span>
            Load is a weighted count of unfinished tasks (urgent ×5, high ×3, medium ×2, low ×1). Risk compares each
            task's due date against the median time completed tasks of the same priority actually took
            {summary.completedSampleSize > 0
              ? ` (learned from ${summary.completedSampleSize} completed ${summary.completedSampleSize === 1 ? 'task' : 'tasks'}).`
              : '. Complete a few tasks to replace the default estimates with your team’s real pace.'}
          </span>
        </p>
      </div>
    </div>
  )
}
