import { describe, expect, it } from 'vitest'
import { emptyDiary, normalizeDiary } from './storage'

describe('one-day local diary', () => {
  it('keeps only feedings from the current local day', () => {
    const now = new Date(2026, 8, 28, 12, 0)
    const today = new Date(2026, 8, 28, 8, 30).toISOString()
    const yesterday = new Date(2026, 8, 27, 22, 30).toISOString()
    const result = normalizeDiary({
      ...emptyDiary(now),
      feedings: [
        { id: 'today', amountMl: 60, fedAt: today },
        { id: 'old', amountMl: 70, fedAt: yesterday },
      ],
    }, now)
    expect(result.feedings.map((feeding) => feeding.id)).toEqual(['today'])
  })

  it('clears entries after midnight and preserves settings', () => {
    const yesterday = new Date(2026, 8, 27, 22, 0)
    const today = new Date(2026, 8, 28, 8, 0)
    const result = normalizeDiary({
      ...emptyDiary(yesterday),
      settings: { intervalMinutes: 120, remindersEnabled: false },
      feedings: [{ id: 'old', amountMl: 60, fedAt: yesterday.toISOString() }],
    }, today)
    expect(result.feedings).toEqual([])
    expect(result.settings).toEqual({ intervalMinutes: 120, remindersEnabled: false })
  })
})
