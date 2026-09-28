import { describe, expect, it } from 'vitest'
import { countdownLabel, formatInterval, localDayKey, nextFeedingAt, timeValueToDate } from './date'
import type { Feeding } from '../types'

const feeding: Feeding = {
  id: '1',
  amountMl: 60,
  fedAt: '2026-09-28T10:00:00.000Z',
}

describe('feeding time helpers', () => {
  it('calculates the next feeding from the selected interval', () => {
    expect(nextFeedingAt(feeding, 180)?.toISOString()).toBe('2026-09-28T13:00:00.000Z')
  })

  it('builds a local calendar-day key', () => {
    expect(localDayKey(new Date(2026, 8, 28, 23, 59))).toBe('2026-09-28')
  })

  it('turns a selected time into a date on the active day', () => {
    const value = timeValueToDate('14:25', new Date(2026, 8, 28, 9, 0))
    expect([value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes()]).toEqual([2026, 8, 28, 14, 25])
  })

  it('formats upcoming and overdue countdowns', () => {
    const due = new Date('2026-09-28T13:00:00.000Z')
    expect(countdownLabel(due, new Date('2026-09-28T11:30:00.000Z'))).toBe('Через 1 ч 30 мин')
    expect(countdownLabel(due, new Date('2026-09-28T13:12:00.000Z'))).toBe('Пора кормить · 12 мин назад')
  })

  it('formats configured intervals', () => {
    expect(formatInterval(150)).toBe('2 ч 30 мин')
    expect(formatInterval(180)).toBe('3 ч')
  })
})
