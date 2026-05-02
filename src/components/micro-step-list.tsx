'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

export function MicroStepList({ taskId }: { taskId: string }) {
  const [steps, setSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSteps() }, [taskId])

  async function fetchSteps() {
    try {
      const res = await fetch(`/api/tasks/${taskId}/microsteps`)
      if (res.ok) setSteps(await res.json())
    } finally { setLoading(false) }
  }

  async function toggleStep(step: any) {
    const updated = steps.map(s => s.id === step.id ? {...s, completed: !s.completed} : s)
    setSteps(updated)
    await fetch(`/api/tasks/${taskId}/microsteps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !step.completed }),
    })
  }

  if (loading) return (
    <Card className="p-8 text-center text-sm text-muted-foreground animate-pulse">
      Loading sessions...
    </Card>
  )
  if (steps.length === 0) return null

  const done = steps.filter(s => s.completed).length
  const pct = Math.round((done / steps.length) * 100)

  return (
    <div className="space-y-3">
      {/* Header card */}
      <Card className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍅</span>
            <span className="font-semibold text-foreground text-base">Pomodoro Sessions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{done} of {steps.length} complete</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              pct === 100 ? 'bg-green-100 text-green-700' :
              pct > 0 ? 'bg-amber-100 text-amber-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {pct === 100 ? '✓ Done' : `${pct}%`}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${pct === 100 ? 'bg-green-500' : 'bg-foreground'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-sm text-green-600 font-medium mt-3 text-center">
            🎉 Excellent work! All sessions complete.
          </p>
        )}
      </Card>

      {/* Individual session cards */}
      {steps.map((step, i) => (
        <Card
          key={step.id}
          className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
            step.completed ? 'opacity-60 bg-muted/30' : 'bg-background hover:border-foreground/30'
          }`}
          onClick={() => toggleStep(step)}
        >
          <div className="flex items-start gap-5 p-6">
            {/* Left: session number + checkbox */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {/* Session number badge */}
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step.completed
                  ? 'bg-foreground border-foreground text-background'
                  : 'border-border text-muted-foreground bg-background'
              }`}>
                {step.completed ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
            </div>

            {/* Right: content */}
            <div className="flex-1 min-w-0">
              {/* Top row: label + time badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  step.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  Session {i + 1}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs">🍅</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {step.estimatedMinutes || 25} min
                  </span>
                </div>
              </div>

              {/* Step title — the main content */}
              <p className={`text-sm leading-relaxed ${
                step.completed
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}>
                {step.title}
              </p>

              {/* Click to toggle hint */}
              {!step.completed && (
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Click to mark complete
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
