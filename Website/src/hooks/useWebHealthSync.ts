import { useCallback, useEffect, useRef, useState } from 'react'

type PedometerLike = {
  start: (opts: { frequency?: number }) => Promise<void> | void
  stop: () => void
  onreading: ((this: PedometerLike, ev: Event) => void) | null
  onerror: ((this: PedometerLike, ev: Event) => void) | null
  stepCount?: number
}

declare global {
  interface Window {
    Pedometer?: new () => PedometerLike
  }
}

function todayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const STORAGE_KEY = 'daryeel.webHealth.steps'
const LINK_KEY = 'daryeel.webHealth.linked'

/**
 * Browser pedometer (Chrome Android) — Google Health–style automatic steps.
 * Falls back to stored day count when Sensor API is unavailable.
 */
export function useWebHealthSync(seedSteps = 0) {
  const [steps, setSteps] = useState(seedSteps)
  const [linked, setLinked] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pedometerRef = useRef<PedometerLike | null>(null)

  useEffect(() => {
    try {
      setLinked(localStorage.getItem(LINK_KEY) === '1')
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { date?: string; steps?: number }
        if (parsed.date === todayKey() && typeof parsed.steps === 'number') {
          setSteps(Math.max(seedSteps, parsed.steps))
          return
        }
      }
    } catch {
      /* ignore */
    }
    setSteps(seedSteps)
  }, [seedSteps])

  const persistSteps = useCallback((next: number) => {
    setSteps(next)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: todayKey(), steps: next }),
      )
    } catch {
      /* ignore */
    }
  }, [])

  const stopSensor = useCallback(() => {
    try {
      pedometerRef.current?.stop()
    } catch {
      /* ignore */
    }
    pedometerRef.current = null
    setTracking(false)
  }, [])

  const startSensor = useCallback(async () => {
    setError(null)
    if (typeof window === 'undefined' || !window.Pedometer) {
      setAvailable(false)
      setError(
        'This browser cannot read steps. Use Chrome on Android, or the Daryeel mobile app for automatic Google Health–style tracking.',
      )
      return false
    }

    try {
      const pedometer = new window.Pedometer()
      pedometer.onreading = () => {
        const count = Number(pedometer.stepCount || 0)
        if (Number.isFinite(count) && count > 0) {
          persistSteps(Math.max(seedSteps, count))
        }
      }
      pedometer.onerror = () => {
        setError('Step sensor permission denied or unavailable.')
        setTracking(false)
      }
      await pedometer.start({ frequency: 1 })
      pedometerRef.current = pedometer
      setAvailable(true)
      setTracking(true)
      return true
    } catch {
      setAvailable(false)
      setError('Could not start the device pedometer.')
      return false
    }
  }, [persistSteps, seedSteps])

  const connect = useCallback(async () => {
    try {
      localStorage.setItem(LINK_KEY, '1')
    } catch {
      /* ignore */
    }
    setLinked(true)
    await startSensor()
  }, [startSensor])

  const disconnect = useCallback(() => {
    try {
      localStorage.setItem(LINK_KEY, '0')
    } catch {
      /* ignore */
    }
    setLinked(false)
    stopSensor()
  }, [stopSensor])

  useEffect(() => {
    if (!linked) return
    void startSensor()
    return () => stopSensor()
  }, [linked, startSensor, stopSensor])

  return {
    steps,
    linked,
    tracking,
    available,
    error,
    connect,
    disconnect,
    setManualSteps: persistSteps,
    caloriesFromSteps: Math.round(steps * 0.04),
    activeMinutesFromSteps: Math.max(0, Math.round(steps / 120)),
  }
}
