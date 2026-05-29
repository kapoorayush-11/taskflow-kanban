import { Check } from 'lucide-react'
import { PROJECT_COLORS } from '../../constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
      <div className="flex gap-2 flex-wrap">
        {PROJECT_COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-white"
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          >
            {value === color && <Check size={14} className="text-white" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  )
}
