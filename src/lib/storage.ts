import { localDayKey } from './date'
import type { DiaryState, Feeding } from '../types'

export const STORAGE_KEY = 'baby-feeding-diary-v1'

const defaultSettings = {
  intervalMinutes: 180,
  remindersEnabled: true,
}

export function emptyDiary(now = new Date()): DiaryState {
  return {
    version: 1,
    dayKey: localDayKey(now),
    feedings: [],
    settings: defaultSettings,
  }
}

function isFeeding(value: unknown): value is Feeding {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Feeding>
  return typeof item.id === 'string'
    && typeof item.amountMl === 'number'
    && item.amountMl > 0
    && item.amountMl <= 500
    && typeof item.fedAt === 'string'
    && !Number.isNaN(Date.parse(item.fedAt))
}

export function normalizeDiary(value: unknown, now = new Date()): DiaryState {
  const fallback = emptyDiary(now)
  if (!value || typeof value !== 'object') return fallback
  const stored = value as Partial<DiaryState>
  const interval = stored.settings?.intervalMinutes
  const settings = {
    intervalMinutes: typeof interval === 'number' && interval >= 30 && interval <= 720
      ? interval
      : defaultSettings.intervalMinutes,
    remindersEnabled: typeof stored.settings?.remindersEnabled === 'boolean'
      ? stored.settings.remindersEnabled
      : defaultSettings.remindersEnabled,
  }

  if (stored.dayKey !== fallback.dayKey) return { ...fallback, settings }

  const feedings = Array.isArray(stored.feedings)
    ? stored.feedings
      .filter(isFeeding)
      .filter((feeding) => localDayKey(new Date(feeding.fedAt)) === fallback.dayKey)
      .sort((a, b) => Date.parse(b.fedAt) - Date.parse(a.fedAt))
    : []

  return { ...fallback, feedings, settings }
}

export function loadDiary(now = new Date()) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalizeDiary(raw ? JSON.parse(raw) : null, now)
  } catch {
    return emptyDiary(now)
  }
}

export function saveDiary(value: DiaryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // The app remains usable for the current session if storage is unavailable.
  }
}
