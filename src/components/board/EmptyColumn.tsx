export function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 mb-3" />
      <p className="text-xs text-gray-400 dark:text-gray-600">No tasks yet</p>
    </div>
  )
}
