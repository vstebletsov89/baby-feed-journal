import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Baby,
  Bell,
  BellRing,
  Check,
  Clock3,
  HardDrive,
  Milk,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import {
  countdownLabel,
  currentTimeValue,
  formatInterval,
  formatTime,
  nextFeedingAt,
  timeValueToDate,
} from '../lib/date'
import {
  playGentleChime,
  requestNotifications,
  showFeedingNotification,
  unlockReminderSound,
} from '../lib/notifications'
import type { DiarySettings, Feeding, FeedingInput } from '../types'

interface DashboardProps {
  feedings: Feeding[]
  settings: DiarySettings
  addFeeding: (values: FeedingInput) => Promise<Feeding>
  updateFeeding: (id: string, values: FeedingInput) => Promise<void>
  deleteFeeding: (id: string) => Promise<void>
  updateSettings: (values: DiarySettings) => Promise<void>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', close)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', close)
      document.body.classList.remove('modal-open')
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-handle" />
        <header>
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function FeedingForm({ initial, onSave, onCancel }: {
  initial?: Feeding
  onSave: (values: FeedingInput) => Promise<void>
  onCancel: () => void
}) {
  const [amount, setAmount] = useState(initial?.amountMl ?? 60)
  const [time, setTime] = useState(currentTimeValue(initial ? new Date(initial.fedAt) : new Date()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!Number.isInteger(amount) || amount < 1 || amount > 500) {
      setError('Введите объём от 1 до 500 мл')
      return
    }
    const fedAt = timeValueToDate(time)
    if (Number.isNaN(fedAt.getTime())) {
      setError('Проверьте время кормления')
      return
    }
    if (fedAt.getTime() > Date.now() + 10 * 60_000) {
      setError('Время кормления не может быть в будущем')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({ amountMl: amount, fedAt: fedAt.toISOString() })
    } catch {
      setError('Не удалось сохранить кормление')
      setBusy(false)
    }
  }

  return (
    <form className="modal-form" onSubmit={submit}>
      <fieldset className="amount-fieldset">
        <legend>Количество</legend>
        <div className="amount-input-wrap">
          <button type="button" aria-label="Уменьшить на 10 мл" onClick={() => setAmount((value) => Math.max(10, value - 10))}>−</button>
          <label>
            <input type="number" inputMode="numeric" min="1" max="500" value={amount} onChange={(event) => setAmount(Number(event.target.value))} autoFocus />
            <span>мл</span>
          </label>
          <button type="button" aria-label="Увеличить на 10 мл" onClick={() => setAmount((value) => Math.min(500, value + 10))}>+</button>
        </div>
        <div className="amount-presets">
          {[40, 60, 70, 90, 120].map((value) => (
            <button type="button" className={amount === value ? 'selected' : ''} onClick={() => setAmount(value)} key={value}>{value}</button>
          ))}
        </div>
      </fieldset>
      <label className="field-label">Время кормления<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Отмена</button>
        <button type="submit" className="primary-button" disabled={busy}><Check size={20} />Сохранить</button>
      </div>
    </form>
  )
}

function SettingsForm({ settings, onSave, onClose, showToast }: {
  settings: DiarySettings
  onSave: DashboardProps['updateSettings']
  onClose: () => void
  showToast: (message: string) => void
}) {
  const [intervalMinutes, setIntervalMinutes] = useState(settings.intervalMinutes)
  const [remindersEnabled, setRemindersEnabled] = useState(settings.remindersEnabled)
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    await onSave({ intervalMinutes, remindersEnabled })
    showToast('Настройки сохранены')
    onClose()
  }

  async function enableNotifications() {
    setError('')
    try {
      unlockReminderSound()
      await requestNotifications()
      showToast('Уведомления разрешены')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось включить уведомления')
    }
  }

  return (
    <form className="modal-form settings-form" onSubmit={save}>
      <label className="field-label">Интервал кормления
        <select value={intervalMinutes} onChange={(event) => setIntervalMinutes(Number(event.target.value))}>
          {[60, 90, 120, 150, 180, 210, 240].map((minutes) => (
            <option value={minutes} key={minutes}>{formatInterval(minutes)}</option>
          ))}
        </select>
      </label>
      <div className="setting-row">
        <div><strong>Напоминание</strong><span>Мягкий сигнал к следующему кормлению</span></div>
        <button
          type="button"
          role="switch"
          aria-checked={remindersEnabled}
          className={`switch ${remindersEnabled ? 'on' : ''}`}
          onClick={() => setRemindersEnabled((value) => !value)}
        ><span /></button>
      </div>
      <button className="notification-button" type="button" onClick={() => void enableNotifications()}>
        <BellRing />Разрешить уведомления
      </button>
      <button className="sound-button" type="button" onClick={() => playGentleChime()}>Прослушать мягкий сигнал</button>
      <p className="settings-note">Напоминание надёжно срабатывает, пока страница открыта. Закрытый браузер не может запланировать сигнал без сервера.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
        <button className="primary-button" type="submit">Сохранить</button>
      </div>
    </form>
  )
}

export function Dashboard({
  feedings,
  settings,
  addFeeding,
  updateFeeding,
  deleteFeeding,
  updateSettings,
}: DashboardProps) {
  const [now, setNow] = useState(new Date())
  const [modal, setModal] = useState<'add' | 'settings' | null>(null)
  const [editing, setEditing] = useState<Feeding | null>(null)
  const [toast, setToast] = useState('')
  const lastAlertedDue = useRef(sessionStorage.getItem('last-feeding-reminder') ?? '')
  const total = useMemo(() => feedings.reduce((sum, feeding) => sum + feeding.amountMl, 0), [feedings])
  const average = feedings.length ? Math.round(total / feedings.length) : 0
  const lastFeeding = feedings[0]
  const dueAt = nextFeedingAt(lastFeeding, settings.intervalMinutes)
  const dueKey = dueAt?.toISOString() ?? ''
  const intervalMs = settings.intervalMinutes * 60_000
  const progress = lastFeeding
    ? Math.min(100, Math.max(0, ((now.getTime() - new Date(lastFeeding.fedAt).getTime()) / intervalMs) * 100))
    : 0

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    if (parameters.get('action') !== 'add') return
    setEditing(null)
    setModal('add')
    parameters.delete('action')
    const query = parameters.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3_000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!settings.remindersEnabled || !dueAt || !dueKey) return
    const delay = now.getTime() - dueAt.getTime()
    if (delay < 0 || delay > intervalMs || lastAlertedDue.current === dueKey) return
    lastAlertedDue.current = dueKey
    sessionStorage.setItem('last-feeding-reminder', dueKey)
    playGentleChime()
    if (document.visibilityState !== 'visible') void showFeedingNotification()
  }, [dueAt, dueKey, intervalMs, now, settings.remindersEnabled])

  useEffect(() => {
    const modelContext = document.modelContext
    if (!modelContext?.registerTool) return
    const lifecycle = new AbortController()
    const register = async () => {
      await modelContext.registerTool({
        name: 'read_today_feeding_summary',
        title: 'Статистика кормлений за сегодня',
        description: 'Показывает число кормлений и суммарный объём за текущий день.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({ totalMl: total, feedingsCount: feedings.length, averageMl: average }),
      }, { signal: lifecycle.signal })
      await modelContext.registerTool({
        name: 'create_feeding',
        title: 'Добавить кормление',
        description: 'Добавляет кормление в локальный дневник за сегодня.',
        inputSchema: {
          type: 'object',
          properties: {
            amountMl: { type: 'integer', minimum: 1, maximum: 500 },
            fedAt: { type: 'string', description: 'Время ISO 8601; если не указано, используется текущее.' },
          },
          required: ['amountMl'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const value = input as { amountMl?: unknown; fedAt?: unknown }
          if (!Number.isInteger(value.amountMl) || Number(value.amountMl) < 1 || Number(value.amountMl) > 500) {
            throw new Error('amountMl должен быть целым числом от 1 до 500')
          }
          const fedAt = typeof value.fedAt === 'string' ? new Date(value.fedAt) : new Date()
          if (Number.isNaN(fedAt.getTime())) throw new Error('Некорректное время fedAt')
          await addFeeding({ amountMl: Number(value.amountMl), fedAt: fedAt.toISOString() })
          return { saved: true }
        },
      }, { signal: lifecycle.signal })
    }
    void register().catch(() => undefined)
    return () => lifecycle.abort()
  }, [addFeeding, average, feedings.length, total])

  async function saveFeeding(values: FeedingInput) {
    unlockReminderSound()
    if (editing) await updateFeeding(editing.id, values)
    else await addFeeding(values)
    setEditing(null)
    setModal(null)
    setToast(editing ? 'Кормление изменено' : 'Кормление добавлено')
  }

  async function remove(feeding: Feeding) {
    if (!window.confirm(`Удалить кормление ${feeding.amountMl} мл в ${formatTime(feeding.fedAt)}?`)) return
    await deleteFeeding(feeding.id)
    setToast('Запись удалена')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="baby-title">
          <span className="baby-avatar"><Baby /></span>
          <div><span>Сегодня, 00:00–24:00</span><h1>Дневник кормлений</h1></div>
        </div>
        <button className="icon-button settings-trigger" onClick={() => setModal('settings')} aria-label="Настройки"><Settings /></button>
      </header>

      <main className="dashboard-main">
        <section className={`next-card ${dueAt && dueAt <= now ? 'due' : ''}`}>
          <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
            <div><Milk /><strong>{dueAt ? formatTime(dueAt) : '—'}</strong></div>
          </div>
          <div className="next-copy">
            <span>Следующее кормление</span>
            <h2>{countdownLabel(dueAt, now)}</h2>
            <p>{lastFeeding ? `Последнее в ${formatTime(lastFeeding.fedAt)} · ${lastFeeding.amountMl} мл` : 'Добавьте первое кормление'}</p>
          </div>
          {settings.remindersEnabled
            ? <BellRing className="reminder-state" aria-label="Напоминания включены" />
            : <Bell className="reminder-state muted-icon" aria-label="Напоминания выключены" />}
        </section>

        <section className="stat-grid" aria-label="Статистика за сегодня">
          <article className="total-stat"><span>Сегодня</span><strong>{total}</strong><small>мл всего</small></article>
          <article><Clock3 /><div><strong>{feedings.length}</strong><span>кормлений</span></div></article>
          <article><Milk /><div><strong>{average}</strong><span>мл в среднем</span></div></article>
        </section>

        <button className="add-button" onClick={() => { unlockReminderSound(); setEditing(null); setModal('add') }}>
          <Plus /><span>Добавить кормление</span>
        </button>

        <section className="history-section">
          <div className="section-heading">
            <div><span>Сегодня</span><h2>Время и количество</h2></div>
            <small>Новый день начнётся автоматически</small>
          </div>
          {feedings.length === 0
            ? <div className="empty-state"><Milk /><h3>Записей пока нет</h3><p>Добавьте первое кормление за сегодня.</p></div>
            : <div className="feeding-list">{feedings.map((feeding) => (
              <article className="feeding-row" key={feeding.id}>
                <time dateTime={feeding.fedAt}>{formatTime(feeding.fedAt)}</time>
                <div className="feeding-amount"><span className="drop-icon"><Milk size={17} /></span><strong>{feeding.amountMl} мл</strong></div>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => { setEditing(feeding); setModal('add') }} aria-label="Изменить кормление"><Pencil /></button>
                  <button className="icon-button danger" onClick={() => void remove(feeding)} aria-label="Удалить кормление"><Trash2 /></button>
                </div>
              </article>
            ))}</div>}
        </section>
      </main>

      <footer className="app-footer"><HardDrive /><span>Записи хранятся только на этом устройстве</span></footer>

      {modal === 'add' && (
        <Modal title={editing ? 'Изменить кормление' : 'Новое кормление'} onClose={() => { setModal(null); setEditing(null) }}>
          <FeedingForm initial={editing ?? undefined} onSave={saveFeeding} onCancel={() => { setModal(null); setEditing(null) }} />
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Настройки" onClose={() => setModal(null)}>
          <SettingsForm settings={settings} onSave={updateSettings} onClose={() => setModal(null)} showToast={setToast} />
        </Modal>
      )}
      {toast && <div className="toast" role="status"><Check size={18} />{toast}</div>}
    </div>
  )
}
