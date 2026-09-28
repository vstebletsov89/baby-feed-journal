import { useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { useLocalDiary } from './hooks/useLocalDiary'
import { registerServiceWorker } from './lib/notifications'

export default function App() {
  const diary = useLocalDiary()

  useEffect(() => {
    void registerServiceWorker()
  }, [])

  return <Dashboard {...diary} />
}
