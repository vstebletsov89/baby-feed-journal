import { useCallback, useEffect, useState } from 'react'
import { loadDiary, normalizeDiary, saveDiary, STORAGE_KEY } from '../lib/storage'
import type { DiarySettings, DiaryState, Feeding, FeedingInput } from '../types'

function sortFeedings(values: Feeding[]) {
  return [...values].sort((a, b) => Date.parse(b.fedAt) - Date.parse(a.fedAt))
}

export function useLocalDiary() {
  const [diary, setDiary] = useState<DiaryState>(() => loadDiary())

  useEffect(() => {
    saveDiary(diary)
  }, [diary])

  useEffect(() => {
    const refreshDay = () => setDiary((current) => normalizeDiary(current))
    const timer = window.setInterval(refreshDay, 30_000)
    const onVisibility = () => document.visibilityState === 'visible' && refreshDay()
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        setDiary(normalizeDiary(JSON.parse(event.newValue)))
      } catch {
        // Ignore a malformed value written by another tab.
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const addFeeding = useCallback(async (input: FeedingInput) => {
    const feeding: Feeding = {
      id: crypto.randomUUID(),
      amountMl: input.amountMl,
      fedAt: input.fedAt,
    }
    setDiary((current) => {
      const active = normalizeDiary(current)
      return { ...active, feedings: sortFeedings([feeding, ...active.feedings]) }
    })
    return feeding
  }, [])

  const updateFeeding = useCallback(async (id: string, input: FeedingInput) => {
    setDiary((current) => {
      const active = normalizeDiary(current)
      return {
        ...active,
        feedings: sortFeedings(active.feedings.map((feeding) => feeding.id === id ? { ...feeding, ...input } : feeding)),
      }
    })
  }, [])

  const deleteFeeding = useCallback(async (id: string) => {
    setDiary((current) => {
      const active = normalizeDiary(current)
      return { ...active, feedings: active.feedings.filter((feeding) => feeding.id !== id) }
    })
  }, [])

  const updateSettings = useCallback(async (settings: DiarySettings) => {
    setDiary((current) => ({ ...normalizeDiary(current), settings }))
  }, [])

  return {
    feedings: diary.feedings,
    settings: diary.settings,
    addFeeding,
    updateFeeding,
    deleteFeeding,
    updateSettings,
  }
}
