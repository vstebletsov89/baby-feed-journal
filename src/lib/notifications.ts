export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  const url = new URL('sw.js', document.baseURI)
  return navigator.serviceWorker.register(url, { scope: new URL('.', document.baseURI).pathname })
}

export async function requestNotifications() {
  if (!('Notification' in window)) throw new Error('Этот браузер не поддерживает уведомления')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Разрешение на уведомления не предоставлено')
  await registerServiceWorker()
}

export async function showFeedingNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const registration = await registerServiceWorker()
  await registration?.showNotification('Пора кормить малыша', {
    body: 'Наступило время следующего кормления.',
    tag: 'feeding-reminder',
    icon: new URL('icons/icon-192.png', document.baseURI).toString(),
  })
}

let audioContext: AudioContext | null = null

export function unlockReminderSound() {
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

export function playGentleChime() {
  unlockReminderSound()
  if (!audioContext) return
  const startedAt = audioContext.currentTime
  ;[523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator()
    const gain = audioContext!.createGain()
    const noteStart = startedAt + index * 0.18
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.08, noteStart + 0.035)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.65)
    oscillator.connect(gain).connect(audioContext!.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + 0.68)
  })
}
