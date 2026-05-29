import type { LucideIcon } from 'lucide-react'

type Accent = 'indigo' | 'emerald' | 'red' | 'amber'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
  accent?: Accent
}

const ACCENTS: Record<Accent, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  red: 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  amber: 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
}

export function StatCard({ icon: Icon, label, value, hint, accent = 'indigo' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ACCENTS[accent]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  )
}
