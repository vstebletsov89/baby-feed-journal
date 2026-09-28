export interface Feeding {
  id: string
  amountMl: number
  fedAt: string
}

export interface DiarySettings {
  intervalMinutes: number
  remindersEnabled: boolean
}

export interface DiaryState {
  version: 1
  dayKey: string
  feedings: Feeding[]
  settings: DiarySettings
}

export interface FeedingInput {
  amountMl: number
  fedAt: string
}
