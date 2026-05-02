'use client'

import { useState, useEffect, useRef } from 'react'
import { useEnergyDetector } from '@/hooks/useEnergyDetector'
import { getAdaptationConfig } from '@/lib/adaptation'

const BREAK_NUDGE_DELAY_MS = 10 * 60 * 1000 // 10 minutes

interface Props {
  taskId: string
  initialContent: string
  onSave: (content: string) => void | Promise<void>
}

export function Scratchpad({ taskId: _, initialContent, onSave }: Props) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [showBreakNudge, setShowBreakNudge] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)

  const { energyLevel, isActive, recordKeystroke } = useEnergyDetector()
  const adaptation = getAdaptationConfig(energyLevel)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [])

  // Break nudge: show after 10 continuous minutes of Low energy
  useEffect(() => {
    if (energyLevel === 'low') {
      if (!nudgeTimerRef.current) {
        nudgeTimerRef.current = setTimeout(() => setShowBreakNudge(true), BREAK_NUDGE_DELAY_MS)
      }
    } else {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current)
        nudgeTimerRef.current = null
      }
      setShowBreakNudge(false)
    }
  }, [energyLevel])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      await onSaveRef.current(value)
      setIsSaving(false)
    }, 1000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    recordKeystroke(e.key)
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${adaptation.containerClass}`}>
      <div className="flex flex-col gap-2 p-4">
        {/* Energy level indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Energy: {isActive ? energyLevel : '—'}
          </span>
          <span className="h-4 text-xs text-zinc-400">
            {isSaving && 'Saving...'}
          </span>
        </div>

        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start planning your approach..."
          className={`w-full resize-none rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition-all duration-500 ${
            adaptation.largeText ? 'min-h-96 text-lg leading-relaxed' : 'min-h-64 text-sm leading-normal'
          }`}
        />

        {/* AI CTA */}
        {adaptation.aiCTAVariant === 'hint' && (
          <p className="text-right text-xs text-zinc-400">
            Feeling stuck? Try breaking this task down.
          </p>
        )}
        {adaptation.aiCTAVariant === 'prominent' && (
          <button
            className="w-full rounded-lg border-2 border-indigo-300 bg-indigo-50 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            onClick={() => {/* wired in next slice */}}
          >
            Break this down? →
          </button>
        )}

        {/* Break nudge */}
        {showBreakNudge && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>You've been struggling for a while — take a short break?</span>
            <button
              onClick={() => setShowBreakNudge(false)}
              className="ml-4 text-amber-600 hover:text-amber-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
