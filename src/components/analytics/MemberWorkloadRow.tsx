import { AlertTriangle, User } from 'lucide-react'
import type { MemberWorkload } from '../../utils/analytics'
import { getInitials, getMemberColor } from '../../utils/analytics'
import { WORKLOAD_STATUS_META } from '../../constants'

interface MemberWorkloadRowProps {
  member: MemberWorkload
  /** Load value mapped to a full bar, so bars are comparable across members. */
  scale: number
}

export function MemberWorkloadRow({ member, scale }: MemberWorkloadRowProps) {
  const meta = WORKLOAD_STATUS_META[member.status]
  const pct = Math.min(100, Math.round((member.load / scale) * 100))

  return (
    <div className="py-3 flex items-start gap-3">
      {member.isUnassigned ? (
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center shrink-0">
          <User size={15} className="text-gray-400 dark:text-gray-500" />
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold"
          style={{ backgroundColor: getMemberColor(member.name) }}
        >
          {getInitials(member.name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</span>
          {member.isUnassigned ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
              No owner
            </span>
          ) : (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${meta.badgeBg} ${meta.badgeText}`}>
              {meta.label}
            </span>
          )}
        </div>

        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${member.isUnassigned ? 'bg-gray-300 dark:bg-gray-600' : meta.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{member.active}</span> active
          </span>
          <span>
            <span className="tabular-nums">{member.inProgress}</span> in progress
          </span>
          <span>
            <span className="tabular-nums">{member.done}</span> done
          </span>
          {member.atRiskCount > 0 && (
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 ml-auto shrink-0">
              <AlertTriangle size={11} />
              {member.atRiskCount} at risk
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
