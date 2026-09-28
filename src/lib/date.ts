import type { Feeding } from '../types'

export function localDayKey(value = new Date()) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function currentTimeValue(value = new Date()) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

export function timeValueToDate(time: string, day = new Date()) {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0)
}

export function nextFeedingAt(lastFeeding: Feeding | undefined, intervalMinutes: number) {
  if (!lastFeeding) return null
  return new Date(new Date(lastFeeding.fedAt).getTime() + intervalMinutes * 60_000)
}

export function countdownLabel(dueAt: Date | null, now: Date) {
  if (!dueAt) return 'После первого кормления'
  const difference = dueAt.getTime() - now.getTime()
  if (difference <= 0) {
    const lateMinutes = Math.floor(Math.abs(difference) / 60_000)
    return lateMinutes < 1 ? 'Время кормления' : `Пора кормить · ${lateMinutes} мин назад`
  }
  const totalMinutes = Math.ceil(difference / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `Через ${hours} ч ${minutes.toString().padStart(2, '0')} мин` : `Через ${minutes} мин`
}

export function formatInterval(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} мин`
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`
}
