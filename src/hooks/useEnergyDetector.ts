'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type EnergyLevel = 'high' | 'medium' | 'low'

interface KeystrokeEvent {
  timestamp: number
  key: string
}

interface Options {
  windowMs?: number
  intervalMs?: number
}

interface Result {
  energyLevel: EnergyLevel
  isActive: boolean
  recordKeystroke: (key: string) => void
}

function computeReading(events: KeystrokeEvent[]): EnergyLevel {
  const total = events.length
  const backspaces = events.filter((e) => e.key === 'Backspace').length
  const cpm = total - backspaces // non-backspace keystrokes per 60-second window = CPM
  const backspaceRatio = total > 0 ? backspaces / total : 0

  if (cpm > 200 && backspaceRatio < 0.1) return 'high'
  if (cpm < 80 || backspaceRatio > 0.2) return 'low'
  return 'medium'
}

export function useEnergyDetector(options?: Options): Result {
  const windowMs = options?.windowMs ?? 60_000
  const intervalMs = options?.intervalMs ?? 10_000

  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium')
  const [isActive, setIsActive] = useState(false)

  const bufferRef = useRef<KeystrokeEvent[]>([])
  // Hysteresis state: track the last reading and how many consecutive times it appeared
  const pendingLevelRef = useRef<EnergyLevel | null>(null)
  const consecutiveCountRef = useRef(0)

  const recordKeystroke = useCallback((key: string) => {
    bufferRef.current.push({ timestamp: Date.now(), key })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      const windowStart = now - windowMs

      // Drop events older than the window
      bufferRef.current = bufferRef.current.filter((e) => e.timestamp >= windowStart)

      const events = bufferRef.current
      setIsActive(events.length > 0)

      const reading = computeReading(events)

      // Hysteresis: require 2 consecutive identical readings before committing
      if (reading === pendingLevelRef.current) {
        consecutiveCountRef.current += 1
      } else {
        pendingLevelRef.current = reading
        consecutiveCountRef.current = 1
      }

      if (consecutiveCountRef.current >= 2) {
        setEnergyLevel(reading)
      }
    }, intervalMs)

    return () => clearInterval(id)
  }, [windowMs, intervalMs])

  return { energyLevel, isActive, recordKeystroke }
}
