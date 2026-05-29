import { format, parseISO } from 'date-fns'
import { Calendar, ChevronRight } from 'lucide-react'
import type { TaskRisk } from '../../utils/analytics'
import { RISK_META, PRIORITY_META } from '../../constants'

interface RiskTaskRowProps {
  risk: TaskRisk
  onOpen: () => void
}

const round = (n: number) => Math.max(1, Math.round(n))

export function RiskTaskRow({ risk, onOpen }: RiskTaskRowProps) {
  const meta = RISK_META[risk.level]
  const priorityMeta = PRIORITY_META[risk.task.priority]

  let detail = ''
  if (risk.level === 'overdue') detail = `${round(-risk.daysUntilDue)}d overdue`
  else if (risk.level === 'at-risk') detail = `~${round(risk.projectedOverDays)}d late`
  else if (risk.level === 'tight') detail = `${Math.max(0, risk.daysUntilDue)}d buffer`

  const basisLabel =
    risk.typical.basis === 'default'
      ? 'no history yet — rough estimate'
      : `similar ${risk.task.priority} tasks take ~${round(risk.typical.days)}d`

  const assignee = risk.task.assignee.trim() || 'Unassigned'

  return (
    <button
      onClick={onOpen}
      className="w-full text-left flex items-center gap-3 py-3 group focus:outline-none"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityMeta.dot}`} title={priorityMeta.label} />

      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {risk.task.title}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
          {risk.project && (
            <span className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: risk.project.color }} />
              <span className="truncate max-w-[110px]">{risk.project.name}</span>
            </span>
          )}
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="truncate max-w-[90px]">{assignee}</span>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{basisLabel}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>{meta.label}</span>
        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          <Calendar size={10} />
          {format(parseISO(risk.task.dueDate as string), 'MMM d')}
        </span>
        {detail && <span className={`text-[11px] ${meta.text} tabular-nums`}>{detail}</span>}
      </div>

      <ChevronRight
        size={15}
        className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0 transition-colors"
      />
    </button>
  )
}
