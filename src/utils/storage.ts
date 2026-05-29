import type { AppData } from '../types'
import { STORAGE_KEY } from '../constants'

const DEFAULT: AppData = { projects: [], tasks: [] }

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    return JSON.parse(raw) as AppData
  } catch {
    return DEFAULT
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
